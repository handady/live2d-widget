import showMessage from "./message.js";

class Model {
  constructor(config) {
    let { models } = config;
    this.modelBasePath = "/live2d/models/"; // 本地模型目录
    this.models = models;
  }

  async loadModel(modelId = 0, message = "我换个衣服看看吧！") {
    if (modelId < 0 || modelId >= this.models.length) modelId = 0; // 防止越界
    const model = this.models[modelId];

    localStorage.setItem("modelId", modelId); // 记录当前模型
    showMessage(message, 4000, 10);

    const modelPath = `${this.modelBasePath}${model.path}`;
    loadlive2d("live2d", modelPath);
    console.log(`Live2D 模型 ${model.name} 加载完成: ${modelPath}`);
  }

  async loadRandModel() {
    const randomIndex = Math.floor(Math.random() * this.models.length);
    this.loadModel(randomIndex, "这套衣服好看吗？");
  }

  async loadOtherModel() {
    let modelId = parseInt(localStorage.getItem("modelId") || "0");
    modelId = (modelId + 1) % this.models.length; // 顺序切换
    this.loadModel(modelId, "换个新造型试试！");
  }
}

export default Model;
