function startTimeAnnouncer(timeData) {
  let lastHourSegment = null;

  setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();

    for (let { hour, text } of timeData) {
      const [startStr, endStr] = hour.split("-");
      const start = parseInt(startStr);
      const end = parseInt(endStr || startStr);

      if (currentHour >= start && currentHour <= end) {
        const currentSegment = `${start}-${end}`;
        if (lastHourSegment !== currentSegment) {
          lastHourSegment = currentSegment;

          let message;
          if (Array.isArray(text)) {
            message = text[Math.floor(Math.random() * text.length)];
          } else {
            message = text;
          }

          if (window.showMessage) {
            window.showMessage(`⏰ ${message}`, 10000, 12); // 优先级高一点
          }
        }
        break; // 找到当前段就不继续找了
      }
    }
  }, 60000); // 每分钟检查一次
}

function checkSeasonEvents(seasonList = []) {
  const now = new Date();
  const nowMonth = now.getMonth() + 1; // JS中从0开始，+1表示当前月
  const nowDate = now.getDate();
  const current = new Date(now.getFullYear(), nowMonth - 1, nowDate); // 当前完整日期对象

  const messages = [];

  seasonList.forEach(({ date, text }) => {
    const [startStr, endStr] = date.split("-");
    const [startMonth, startDay] = startStr.split("/").map(Number);
    const [endMonth, endDay] = (endStr || startStr).split("/").map(Number);

    // 构建开始和结束日期对象
    const startDate = new Date(now.getFullYear(), startMonth - 1, startDay);
    let endDate = new Date(now.getFullYear(), endMonth - 1, endDay);

    // 跨年处理（如 12/30 - 1/2）
    if (endDate < startDate) {
      // 跨年，把结束日期加一年
      endDate.setFullYear(endDate.getFullYear() + 1);
      // 如果当前是1月并且结束日期在下一年，当前也要 +1 年
      if (nowMonth < startMonth) {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    if (current >= startDate && current <= endDate) {
      // 命中时间段
      let message = Array.isArray(text)
        ? text[Math.floor(Math.random() * text.length)]
        : text;

      message = message.replace("{year}", now.getFullYear());
      messages.push(message);
    }
  });

  return messages; // 返回符合当前节日的消息数组
}

function bindClickEvents(model) {
  model.interactive = true;

  model.on("pointerdown", (e) => {
    // 将点击坐标转换到模型局部坐标系（像素）
    const point = model.worldTransform.applyInverse(e.data.global);

    // 再转换为标准化坐标（-1 ~ 1）
    const logicalX = (point.x / (model.width * model.scale.x)) * 2 - 1;
    const logicalY = (point.y / (model.height * model.scale.y)) * 2 - 1;

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

export { startTimeAnnouncer, checkSeasonEvents, bindClickEvents };
