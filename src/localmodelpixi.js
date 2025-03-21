import showMessage from "./message.js";

export function bindClickEvents(model) {
  model.interactive = true;

  model.on("pointerdown", (e) => {
    // 将点击坐标转换到模型局部坐标系（像素）
    const point = model.worldTransform.applyInverse(e.data.global);

    // 再转换为标准化坐标（-1 ~ 1）
    const logicalX = (point.x / (model.width * model.scale.x)) * 2 - 1;
    const logicalY = (point.y / (model.height * model.scale.y)) * 2 - 1;

    console.log(
      "点击坐标（归一化）:",
      logicalX.toFixed(2),
      logicalY.toFixed(2)
    );

    const hitAreas = model.internalModel.settings.hitAreas;
    const hitAreasCustom = model.internalModel.settings.json.hit_areas_custom;

    let hitHead = false;
    let hitBody = false;

    // ✅ Cubism 3/4：使用 hitTest API 或 hitAreas
    if (Array.isArray(hitAreas) && typeof model.hitTest === "function") {
      const hits = model.hitTest(x, y); // 官方方法：返回 ["Head"] 或 ["Body"]
      if (hits.includes("Head")) hitHead = true;
      if (hits.includes("Body")) hitBody = true;
    }

    // ✅ Cubism 2：使用 hit_areas_custom 自定义判断
    if (hitAreasCustom) {
      let hitAreasCustomData = {
        head_x: [-0.2, 0.45],
        head_y: [0.2, -0.45],
        body_x: [-0.25, 0.5],
        body_y: [1, 0.35],
      };
      if (
        logicalX >= hitAreasCustomData.head_x?.[0] &&
        logicalX <= hitAreasCustomData.head_x?.[1] &&
        logicalY >= hitAreasCustomData.head_y?.[1] &&
        logicalY <= hitAreasCustomData.head_y?.[0]
      ) {
        hitHead = true;
      }

      if (
        logicalX >= hitAreasCustomData.body_x?.[0] &&
        logicalX <= hitAreasCustomData.body_x?.[1] &&
        logicalY >= hitAreasCustomData.body_y?.[1] &&
        logicalY <= hitAreasCustomData.body_y?.[0]
      ) {
        hitBody = true;
      }
    }

    console.log("点击区域:", hitHead ? "头部" : "", hitBody ? "身体" : "");

    // ✅ 触发动作和提示
    if (hitHead) {
      const headMessages = [
        "(*≧ω≦) 哎呀~ 你摸我头了呢！",
        "(๑•́ ₃ •̀๑) 嗯？摸头就会变聪明吗？",
        "(｡>﹏<｡) 嘤嘤，不要随便摸啦~",
        "(✿◡‿◡) 诶嘿嘿~ 好舒服~",
      ];

      showMessage(
        headMessages[Math.floor(Math.random() * headMessages.length)],
        4000,
        12
      );
      model.motion("flick_head");
    } else if (hitBody) {
      const bodyMessages = [
        "(>///<) 呜呜呜~ 不要随便碰我啦！",
        "(╬▔皿▔) 嘤！你干嘛啦？！",
        "(///▽///) 诶？！这样不太好吧...",
        "(//ω//) 嘿嘿... 你是在戳我吗？",
      ];
      showMessage(
        bodyMessages[Math.floor(Math.random() * bodyMessages.length)],
        4000,
        12
      );
      model.motion("tap_body");
    }
  });
}

class Model {
  constructor(config) {
    let { models, app } = config;
    this.modelBasePath = "/live2d/models/"; // 本地模型目录
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
    }

    const modelPath = `${this.modelBasePath}${model.path}`;
    const modelData = await PIXI.live2d.Live2DModel.from(modelPath);
    // 获取模型的真实尺寸
    const modelBounds = modelData.getBounds();
    const modelWidth = modelBounds.width;
    const modelHeight = modelBounds.height;

    console.log("模型原始尺寸:", modelWidth, modelHeight);

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
