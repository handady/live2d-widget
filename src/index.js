import Model from "./localmodelpixi.js";
import showMessage from "./message.js";
import randomSelection from "./utils.js";
import tools from "./tools.js";
import { startTimeAnnouncer, checkSeasonEvents } from "./functions/index.js";

window.showMessage = showMessage;

function loadWidget(config) {
  const model = new Model(config);
  localStorage.removeItem("waifu-display");
  sessionStorage.removeItem("waifu-text");
  // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
  setTimeout(() => {
    document.getElementById("waifu").style.bottom = 0;
  }, 0);

  (function registerTools() {
    tools["switch-model"].callback = () => model.loadOtherModel();
    tools["switch-texture"].callback = () => model.loadRandModel();
    if (!Array.isArray(config.tools)) {
      config.tools = Object.keys(tools);
    }
    for (let tool of config.tools) {
      if (tools[tool]) {
        const { icon, callback } = tools[tool];
        document
          .getElementById("waifu-tool")
          .insertAdjacentHTML(
            "beforeend",
            `<span id="waifu-tool-${tool}">${icon}</span>`
          );
        document
          .getElementById(`waifu-tool-${tool}`)
          .addEventListener("click", callback);
      }
    }
  })();

  function welcomeMessage(time) {
    const text = `欢迎来到<span>「${document.title.split(" - ")[0]}」</span>`;
    let from;
    if (document.referrer !== "") {
      const referrer = new URL(document.referrer),
        domain = referrer.hostname.split(".")[1];
      const domains = {
        baidu: "百度",
        so: "360搜索",
        google: "谷歌搜索",
      };
      if (location.hostname === referrer.hostname) return text;

      if (domain in domains) from = domains[domain];
      else from = referrer.hostname;
      return `Hello！来自 <span>${from}</span> 的朋友<br>${text}`;
    }
    return text;
  }

  function registerEventListener(result) {
    // 检测用户活动状态，并在空闲时显示消息
    let userAction = false,
      userActionTimer,
      messageArray = result.message.default;
    window.addEventListener("mousemove", () => (userAction = true));
    window.addEventListener("keydown", () => (userAction = true));
    setInterval(() => {
      if (userAction) {
        userAction = false;
        clearInterval(userActionTimer);
        userActionTimer = null;
      } else if (!userActionTimer) {
        userActionTimer = setInterval(() => {
          showMessage(messageArray, 6000, 9);
        }, 20000);
      }
    }, 1000);
    showMessage(welcomeMessage(result.time), 7000, 11);
    window.addEventListener("mouseover", (event) => {
      for (let { selector, text } of result.mouseover) {
        if (!event.target.matches(selector)) continue;
        text = randomSelection(text);
        text = text.replace("{text}", event.target.innerText);
        showMessage(text, 4000, 8);
        return;
      }
    });
    window.addEventListener("click", (event) => {
      for (let { selector, text } of result.click) {
        if (!event.target.matches(selector)) continue;
        text = randomSelection(text);
        text = text.replace("{text}", event.target.innerText);
        showMessage(text, 4000, 8);
        return;
      }
    });
    const seasonMessages = checkSeasonEvents(result.seasons);
    seasonMessages.forEach((msg) => messageArray.push(msg)); // 加入闲聊池

    const devtools = () => {};
    console.log("%c", devtools);
    devtools.toString = () => {
      showMessage(result.message.console, 6000, 9);
    };
    window.addEventListener("copy", () => {
      showMessage(result.message.copy, 6000, 9);
    });
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden)
        showMessage(result.message.visibilitychange, 6000, 9);
    });

    // 时间段问候
    if (Array.isArray(result.time)) {
      startTimeAnnouncer(result.time);
    }
  }

  (function initModel() {
    let modelId = localStorage.getItem("modelId"),
      modelTexturesId = localStorage.getItem("modelTexturesId");
    if (modelId === null) {
      // 首次访问加载 指定模型 的 指定材质
      modelId = 1; // 模型 ID
      modelTexturesId = 53; // 材质 ID
    }
    model.loadModel(modelId, modelTexturesId);
    fetch(config.waifuPath)
      .then((response) => response.json())
      .then(registerEventListener);
  })();
}

function initWidget(config, apiPath) {
  if (typeof config === "string") {
    config = {
      waifuPath: config,
      apiPath,
    };
  }
  const toggle = document.getElementById("waifu-toggle");
  toggle.addEventListener("click", () => {
    toggle.classList.remove("waifu-toggle-active");
    if (toggle.getAttribute("first-time")) {
      loadWidget(config);
      toggle.removeAttribute("first-time");
    } else {
      localStorage.removeItem("waifu-display");
      document.getElementById("waifu").style.display = "";
      setTimeout(() => {
        document.getElementById("waifu").style.bottom = 0;
      }, 0);
    }
  });
  if (
    localStorage.getItem("waifu-display") &&
    Date.now() - localStorage.getItem("waifu-display") <= 86400000
  ) {
    toggle.setAttribute("first-time", true);
    setTimeout(() => {
      toggle.classList.add("waifu-toggle-active");
    }, 0);
  } else {
    loadWidget(config);
  }
}

export default initWidget;
