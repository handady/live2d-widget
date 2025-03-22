import showMessage from "./message.js";
import { bindClickEvents } from "./functions/index.js";

class Model {
  constructor(config) {
    let { models, app } = config;
    this.modelBasePath = "./live2d/models/"; // 本地模型目录
    this.models = models;
    this.app = app;
    this.currentModel = null; // 存储当前模型对象
  }

  async loadModel(modelId = 0, message = "我换个衣服看看吧！") {
    if (modelId < 0 || modelId >= this.models.length) modelId = 0;
    const model = this.models[modelId];

    localStorage.setItem("modelId", modelId);
    showMessage(message, 4000, 10);

    // 如果有旧模型，移除它
    if (this.currentModel) {
      this.app.stage.removeChild(this.currentModel);
      this.currentModel.destroy(); // 释放资源，防止内存泄漏
      this.currentModel = null;
      window.currentModel = null;
    }

    const modelPath = `${this.modelBasePath}${model.path}`;
    const modelData = await PIXI.live2d.Live2DModel.from(modelPath);
    // 获取模型的真实尺寸
    const modelBounds = modelData.getBounds();
    const modelWidth = modelBounds.width;
    const modelHeight = modelBounds.height;

    // 调整 canvas 尺寸
    const canvas = document.getElementById("live2d");
    canvas.width = modelWidth;
    canvas.height = modelHeight;

    // 让 PixiJS 也适配新的 canvas 尺寸
    this.app.renderer.resize(modelWidth, modelHeight);

    // 计算缩放比例，防止超出 canvas
    const scaleFactor = Math.min(
      canvas.width / modelWidth,
      canvas.height / modelHeight
    );
    modelData.scale.set(scaleFactor * 0.95);

    // 居中模型
    modelData.anchor.set(0.5, 0.5);
    modelData.x = canvas.width / 2;
    modelData.y = canvas.height / 2;

    // ✅ 绑定点击区域事件
    bindClickEvents(modelData);

    // 存储当前模型，并添加到舞台
    this.currentModel = modelData;
    window.currentModel = modelData; // 方便调试
    this.app.stage.addChild(modelData);

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
