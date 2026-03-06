const yearEl = document.getElementById("year");
const hiBtn = document.getElementById("hiBtn");
const msg = document.getElementById("msg");
const topBtn = document.getElementById("topBtn");
const skillsCard = document.querySelector(".skills-card");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (hiBtn && msg) {
  hiBtn.addEventListener("click", () => {
    msg.textContent = "Hey there 👋 thanks for visiting my portfolio.";
  });
}

window.addEventListener("scroll", () => {
  if (window.scrollY > 280) {
    topBtn.classList.add("show");
  } else {
    topBtn.classList.remove("show");
  }
});

if (topBtn) {
  topBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

if (skillsCard) {
  skillsCard.addEventListener("mousemove", (e) => {
    const rect = skillsCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    skillsCard.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
  });

  skillsCard.addEventListener("mouseleave", () => {
    skillsCard.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  });
}

const canvas = document.getElementById("skillsRadar");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const skillFills = [...document.querySelectorAll(".skill-fill")];

  const labels = skillFills.map((item) => item.dataset.label);
  const values = skillFills.map((item) => Number(item.dataset.value));
  const maxValue = 100;
  const levels = 5;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 145;

  function getPoint(index, value, total) {
    const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
    const r = radius * (value / maxValue);

    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      angle
    };
  }

  function drawPolygon(r, strokeStyle, fillStyle = null) {
    ctx.beginPath();

    labels.forEach((_, i) => {
      const angle = ((Math.PI * 2) / labels.length) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawLabels() {
    labels.forEach((label, i) => {
      const angle = ((Math.PI * 2) / labels.length) * i - Math.PI / 2;
      const labelRadius = radius + 26;
      const x = cx + Math.cos(angle) * labelRadius;
      const y = cy + Math.sin(angle) * labelRadius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius
      );
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.stroke();

      ctx.fillStyle = "#dfe8ff";
      ctx.font = "13px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y);
    });
  }

  function drawDataShape() {
    ctx.beginPath();

    values.forEach((value, i) => {
      const point = getPoint(i, value, labels.length);

      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });

    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(120,166,255,0.55)");
    gradient.addColorStop(1, "rgba(157,123,255,0.30)");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(150,190,255,0.95)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(120,166,255,0.35)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    values.forEach((value, i) => {
      const point = getPoint(i, value, labels.length);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f8ff";
      ctx.fill();
    });
  }

  function drawRadar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let level = levels; level >= 1; level--) {
      const r = radius * (level / levels);
      drawPolygon(r, "rgba(255,255,255,0.12)");
    }

    drawLabels();
    drawDataShape();
  }

  drawRadar();
}