document.addEventListener("DOMContentLoaded", function () {
    const scanner = new Html5Qrcode("qr-scanner");
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const scanPayButton = document.getElementById("scan-pay");
    const transactionHistory = document.getElementById("transaction-history");
    const exportBtn = document.getElementById("export-history");
    const searchInput = document.getElementById("search-transaction");

    // Load transaction history
    loadTransactionHistory();

    scanPayButton.addEventListener("click", function () {
        if (!amountInput.value || isNaN(amountInput.value) || Number(amountInput.value) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        startQRCodeScan();
    });

    function startQRCodeScan() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                scanner.start(
                    { facingMode: "environment" }, 
                    { fps: 10, qrbox: 250 },
                    (decodedText) => {
                        scanner.stop();
                        processUPI(decodedText);
                    },
                    (error) => {
                        console.error(error);
                    }
                );
            })
            .catch(err => {
                alert("Camera access is required for QR scanning.");
                console.error(err);
            });
    }

    function processUPI(qrData) {
        let upiMatch = qrData.match(/upi:\/\/pay\?pa=([^&]+)/);
        if (!upiMatch) {
            alert("Invalid UPI QR Code. Please scan a valid code.");
            return;
        }

        let upiId = upiMatch[1];
        let upiLink = `${qrData}&am=${amountInput.value}`;

        // Save transaction
        saveTransaction(upiId, amountInput.value, categoryInput.value);

        // iOS Safari Fix: Open via User Interaction
        let confirmPayment = confirm("Proceed with payment in UPI App?");
        if (confirmPayment) {
            setTimeout(() => {
                window.location.href = upiLink;
            }, 500); // Delay to ensure Safari doesn't block it
        }
    }

    function saveTransaction(upiId, amount, category) {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        let transaction = {
            id: transactions.length + 1,
            upiId: upiId,
            amount: parseFloat(amount).toFixed(2),
            category: category,
            date: new Date().toLocaleString()
        };

        transactions.unshift(transaction);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        loadTransactionHistory();
    }

    function loadTransactionHistory() {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactionHistory.innerHTML = "";

        transactions.forEach((txn) => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${txn.id}</td>
                <td>${txn.upiId}</td>
                <td>₹${txn.amount}</td>
                <td>${txn.category}</td>
                <td>${txn.date}</td>
            `;
            transactionHistory.appendChild(row);
        });
    }

    exportBtn.addEventListener("click", function () {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        if (transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }

        let csvContent = "Transaction ID,UPI ID,Amount,Category,Date\n";
        transactions.forEach((txn) => {
            csvContent += `${txn.id},${txn.upiId},${txn.amount},${txn.category},${txn.date}\n`;
        });

        let blob = new Blob([csvContent], { type: "text/csv" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "UPI_Transactions.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    searchInput.addEventListener("input", function () {
        let filterText = searchInput.value.toLowerCase();
        let rows = transactionHistory.getElementsByTagName("tr");

        for (let row of rows) {
            let text = row.textContent.toLowerCase();
            row.style.display = text.includes(filterText) ? "" : "none";
        }
    });
});
