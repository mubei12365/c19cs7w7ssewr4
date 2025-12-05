document.addEventListener("DOMContentLoaded", function () {
    const path = location.pathname.toLowerCase();

    if (path.endsWith("index.html") || path === "/" || path === "") {
        sessionStorage.clear();
        localStorage.removeItem("paymentConfirmed");
        localStorage.removeItem("lastOrderId");

        document.querySelectorAll(".buy, .buy.special").forEach(btn => {
            btn.onclick = function () {
                const card = this.closest(".card");
                const name = card.dataset.name;
                price = parseFloat(card.dataset.price);

                sessionStorage.setItem("order", JSON.stringify({ name, price }));
                location.href = "confirm.html";
            };
        });
    }

    else if (path.includes("confirm.html")) {
        const order = JSON.parse(sessionStorage.getItem("order"));
        if (!order) { alert("No order found!"); location.href = "index.html"; return; }

        document.getElementById("coinName").textContent = order.name;
        document.getElementById("marketRate").textContent = "$" + order.price.toLocaleString();

        const amountInput = document.getElementById("amount");
        const totalUSD = document.getElementById("totalUSD");
        const payUSDT = document.getElementById("payUSDT");
        const payBtn = document.getElementById("payNow");

        const calc = () => {
            let qty = parseFloat(amountInput.value) || 0;
            if (qty <= 0) qty = 0;
            if (order.name === "PANDA") qty = Math.min(qty, 1000);
            amountInput.value = qty.toFixed(8).replace(/\.?0+$/, "");

            const usdValue = qty * order.price;
            const needUSDT = usdValue / 3;

            totalUSD.textContent = usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8});
            payUSDT.textContent = needUSDT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8}) + " USDT";

            payBtn.disabled = needUSDT < 100;
            payBtn.style.opacity = needUSDT < 100 ? "0.5" : "1";
        };

        document.getElementById("plus").onclick = () => {
            amountInput.value = (parseFloat(amountInput.value || 0) + 0.01).toFixed(8);
            calc();
        };
        document.getElementById("minus").onclick = () => {
            if (parseFloat(amountInput.value) >= 0.02) {
                amountInput.value = (parseFloat(amountInput.value) - 0.01).toFixed(8);
                calc();
            }
        };

        amountInput.oninput = () => {
            let val = amountInput.value.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
            amountInput.value = val;
            calc();
        };

        calc();

        payBtn.onclick = () => {
            const wallet = document.getElementById("wallet").value.trim();
            if (!wallet) return alert("Please enter the wallet address!");
            if (!/^0x[a-fA-F0-9]{40}$/i.test(wallet)) return alert("Wallet address format is incorrect!");

            sessionStorage.setItem("payAmount", payUSDT.textContent);
            location.href = "payment.html";
        };
    }

    else if (path.includes("payment.html")) {
        const amountText = sessionStorage.getItem("payAmount");
        if (!amountText) { location.href = "index.html"; return; }

        document.getElementById("usdtAmount").textContent = amountText;

        const usdtRaw = Math.round(parseFloat(amountText) * 1000000);

        const paymentUri = `ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7@1/transfer?address=0xe5eEE64A2e316Ef7939b8eBE30d9Ecd8E4d7E845&uint256=${usdtRaw}`;

        new QRCode(document.getElementById("qrcode"), {
            text: paymentUri,
            width: 280,
            height: 280,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        const tip = document.createElement("p");
        tip.innerHTML = `<strong style="color:#00ff9d">扫码自动填写金额</strong><br>支持币安 / OKX / imToken / MetaMask / TrustWallet`;
        tip.style.marginTop = "1.5rem";
        tip.style.color = "#79c879";
        document.querySelector(".payment-box.glass").insertBefore(tip, document.getElementById("paid"));

        document.getElementById("paid").onclick = () => {
            localStorage.setItem("paymentConfirmed", "true");
            localStorage.setItem("lastOrderId", "CH" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,5).toUpperCase());
            location.href = "success.html";
        };
    }

    else if (path.includes("success.html")) {
        if (localStorage.getItem("paymentConfirmed") !== "true") {
            alert("Access denied!");
            location.href = "index.html";
            return;
        }
        document.getElementById("orderId").textContent = localStorage.getItem("lastOrderId") || "CH00000000";

        let time = 30;
        const timer = setInterval(() => {
            time--;
            document.getElementById("statusText").innerHTML = `Verifying transaction... <strong style="color:#79c879">${time}s</strong>`;
            if (time <= 0) {
                clearInterval(timer);
                document.getElementById("statusText").innerHTML = `<span style="color:#ff6b6b">✗ Payment timeout</span>`;
                document.getElementById("backHome").style.display = "block";
            }
        }, 1000);

        document.getElementById("backHome").onclick = () => {
            localStorage.clear();
            sessionStorage.clear();
            location.href = "index.html";
        };
    }
});
