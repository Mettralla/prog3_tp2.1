class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            const currenciesData = await response.json();
            for (const currency in currenciesData) {
                this.currencies.push(new Currency(currency, currenciesData[currency]));
            }
        } catch (error) {
            console.error(error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code == toCurrency.code) {
            return Number(amount);
        }

        try {
            const response = await fetch(`${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`);
            const conversionData = await response.json();
            return conversionData.rates[toCurrency.code];
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // FUNCIONALIDADES ADICIONALES
    async getExchangeRate(date, fromCurrency, toCurrency) {
        try {
            const response = await fetch(`${this.apiUrl}/${date}?from=${fromCurrency.code}&to=${toCurrency.code}`);
            const rateData = await response.json();
            return Number(rateData.rates[toCurrency.code]);
        } catch (error) {
            console.error(error);
            return null;
        }
    }
    
    async getDifferenceBetweenDates(fromCurrency, toCurrency) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const rateToday = await this.getExchangeRate(todayStr, fromCurrency, toCurrency);
        const rateYesterday = await this.getExchangeRate(yesterdayStr, fromCurrency, toCurrency);

        if (rateToday === null || rateYesterday === null) {
            return null;
        }

        return rateToday - rateYesterday;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;

            // **TASA DE CAMBIO - MUESTRA UNA LINEA LUEGO DE LA CONVERSION**
            const difference = await converter.getDifferenceBetweenDates(fromCurrency, toCurrency);
            if (difference !== null) {
                const differenceDiv = document.createElement("p");
                differenceDiv.textContent = `La diferencia en la tasa de cambio entre hoy y ayer es de ${difference.toFixed(4)}`;
                resultDiv.appendChild(differenceDiv);
            } else {
                const errorDiv = document.createElement("p");
                errorDiv.textContent = "Error al obtener la diferencia en tasas de cambio.";
                resultDiv.appendChild(errorDiv);
            }
            // **TASA DE CAMBIO**

        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
