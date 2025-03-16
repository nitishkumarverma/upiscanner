document.addEventListener("DOMContentLoaded", function () {
    const scanner = new Html5Qrcode("reader");
    const scanPayBtn = document.getElementById("scanPay");
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const historyTable = document.getElementById("history");
    const searchInput = document.getElementById("search");
    const exportBtn = document.getElementById("export");
    const summaryList = document.getElementById("summary");

    function updateTransactionHistory() {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        historyTable.innerHTML = "";
        transactions.forEach(tx => {
            let row = `<tr>
                <td>${tx.date}</td>
                <td>${tx.upiId}</td>
                <td>${tx.amount}</td>
                <td>${tx.category}</td>
            </tr>`;
            historyTable.innerHTML += row;
        });
        updateSummary(transactions);
    }

    function updateSummary(transactions) {
        let summary = {};
        transactions.forEach(tx => {
            if (!summary[tx.category]) {
                summary[tx.category] = 0;
            }
            summary[tx.category] += parseFloat(tx.amount);
        });

        summaryList.innerHTML = "";
        for (let category in summary) {
            summaryList.innerHTML += `<li>${category}: ₹${summary[category].toFixed(2)}</li>`;
        }
    }

    function saveTransaction(upiId, amount, category) {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        let newTransaction = {
            date: new Date().toLocaleString(),
            upiId,
            amount,
            category
        };
        transactions.push(newTransaction);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        updateTransactionHistory();
    }

    function scanQRCode() {
        // Ensuring iOS compatibility for camera permissions
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: 250 },
                    (decodedText) => {
                        scanner.stop();
                        let upiId = decodedText.match(/upi:\/\/pay\?pa=([^&]+)/);
                        if (upiId) {
                            let upiLink = `${decodedText}&am=${amountInput.value}`;
                            saveTransaction(upiId[1], amountInput.value, categoryInput.value);
                            window.open(upiLink, "_blank");  // iOS Fix
                        } else {
                            alert("Invalid UPI QR Code");
                        }
                    },
                    (error) => {
                        console.log(error);
                    }
                );
            })
            .catch(err => {
                alert("Camera access is required for QR scanning.");
                console.error(err);
            });
    }

    function exportToCSV() {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        let csvContent = "Date,UPI ID,Amount,Category\n";
        transactions.forEach(tx => {
            csvContent += `${tx.date},${tx.upiId},${tx.amount},${tx.category}\n`;
        });

        let blob = new Blob([csvContent], { type: "text/csv" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "transactions.csv";
        link.click();
    }

    searchInput.addEventListener("input", function () {
        let query = searchInput.value.toLowerCase();
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        let filtered = transactions.filter(tx => 
            tx.upiId.toLowerCase().includes(query) ||
            tx.category.toLowerCase().includes(query)
        );
        historyTable.innerHTML = "";
        filtered.forEach(tx => {
            let row = `<tr>
                <td>${tx.date}</td>
                <td>${tx.upiId}</td>
                <td>${tx.amount}</td>
                <td>${tx.category}</td>
            </tr>`;
            historyTable.innerHTML += row;
        });
    });

    scanPayBtn.addEventListener("click", function () {
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            alert("Enter a valid amount");
            return;
        }
        scanQRCode();
    });

    exportBtn.addEventListener("click", exportToCSV);

    updateTransactionHistory();
});
