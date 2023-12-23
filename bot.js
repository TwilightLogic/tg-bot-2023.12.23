require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const axios = require("axios");

// Exchange rate API
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/";

// Weather API
const WEATHER_API_URL = "http://api.openweathermap.org/data/2.5/weather";

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    const response = await axios.get(
      `${EXCHANGE_API_URL}${fromCurrency}?apiKey=${process.env.EXCHANGE_API_KEY}`
    );
    const rate = response.data.rates[toCurrency];
    if (!rate) {
      throw new Error(
        `Unable to get exchange rate from ${fromCurrency} to ${toCurrency}`
      );
    }
    const convertedAmount = (amount * rate).toFixed(2);
    return convertedAmount;
  } catch (error) {
    console.error("Currency conversion error:", error);
    throw error;
  }
};

const getWeather = async (city) => {
  try {
    const response = await axios.get(
      `${WEATHER_API_URL}?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    const { weather, main } = response.data;
    return `The weather in ${city} is ${weather[0].description} with a temperature of ${main.temp}°C.`;
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw error;
  }
};

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msg.text?.startsWith("/convert")) {
    const args = msg.text.split(" ");
    if (args.length < 4) {
      bot.sendMessage(
        msg.chat.id,
        "Please use the format: /convert [amount] [source_currency] to [target_currency]"
      );
      return;
    }
    const amount = args[1];
    const fromCurrency = args[2].toUpperCase();
    const toCurrency = args[4].toUpperCase();

    convertCurrency(amount, fromCurrency, toCurrency)
      .then((convertedAmount) => {
        bot.sendMessage(
          msg.chat.id,
          `${amount} ${fromCurrency} is equal to ${convertedAmount} ${toCurrency}`
        );
      })
      .catch((error) => {
        bot.sendMessage(
          msg.chat.id,
          `Currency conversion error: ${error.message}`
        );
      });
  } else if (msg.text?.startsWith("/weather")) {
    const city = msg.text.split(" ")[1];
    if (!city) {
      bot.sendMessage(
        msg.chat.id,
        "Please specify a city like so: /weather [city]"
      );
      return;
    }
    getWeather(city)
      .then((weatherDescription) => {
        bot.sendMessage(msg.chat.id, weatherDescription);
      })
      .catch((error) => {
        bot.sendMessage(
          msg.chat.id,
          `Error fetching weather: ${error.message}`
        );
      });
  } else if (msg.text) {
    bot.sendMessage(
      chatId,
      `🥰 Hi sweetie, here is your message: "${msg.text}"`
    );
  }
});
