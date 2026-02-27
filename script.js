<<<<<<< HEAD
document.querySelectorAll("#year").forEach(el => el.textContent = new Date().getFullYear());

const btn = document.getElementById("hiBtn");
const msg = document.getElementById("msg");
if (btn && msg) {
  btn.addEventListener("click", () => {
    msg.textContent = "Thanks for checking out my portfolio! 👋";
  });
}

const glow = document.createElement("div");
glow.className = "glow";
document.body.appendChild(glow);

window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty("--mx", `${x}%`);
  document.documentElement.style.setProperty("--my", `${y}%`);
}, { passive: true });

const toReveal = [
  ...document.querySelectorAll(".card"),
  ...document.querySelectorAll(".hero"),
  ...document.querySelectorAll(".pagehead")
];
toReveal.forEach(el => el.classList.add("reveal"));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
}, { threshold: 0.12 });

toReveal.forEach(el => io.observe(el));

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   
    const py = (e.clientY - r.top) / r.height;  

    card.style.setProperty("--hx", `${px * 100}%`);
    card.style.setProperty("--hy", `${py * 100}%`);

    const tiltX = (py - 0.5) * -8;
    const tiltY = (px - 0.5) * 10;
    card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

const magnets = document.querySelectorAll(".btn, button");
magnets.forEach(el => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

const topBtn = document.getElementById("topBtn");
if (topBtn) {
  const toggleTop = () => {
    if (window.scrollY > 300) topBtn.classList.add("show");
    else topBtn.classList.remove("show");
  };
  toggleTop();
  window.addEventListener("scroll", toggleTop, { passive: true });
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
=======
document.querySelectorAll("#year").forEach(el => el.textContent = new Date().getFullYear());

const btn = document.getElementById("hiBtn");
const msg = document.getElementById("msg");
if (btn && msg) {
  btn.addEventListener("click", () => {
    msg.textContent = "Thanks for checking out my portfolio! 👋";
  });
}

const glow = document.createElement("div");
glow.className = "glow";
document.body.appendChild(glow);

window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty("--mx", `${x}%`);
  document.documentElement.style.setProperty("--my", `${y}%`);
}, { passive: true });

const toReveal = [
  ...document.querySelectorAll(".card"),
  ...document.querySelectorAll(".hero"),
  ...document.querySelectorAll(".pagehead")
];
toReveal.forEach(el => el.classList.add("reveal"));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
}, { threshold: 0.12 });

toReveal.forEach(el => io.observe(el));

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   
    const py = (e.clientY - r.top) / r.height;  

    card.style.setProperty("--hx", `${px * 100}%`);
    card.style.setProperty("--hy", `${py * 100}%`);

    const tiltX = (py - 0.5) * -8;
    const tiltY = (px - 0.5) * 10;
    card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

const magnets = document.querySelectorAll(".btn, button");
magnets.forEach(el => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

const topBtn = document.getElementById("topBtn");
if (topBtn) {
  const toggleTop = () => {
    if (window.scrollY > 300) topBtn.classList.add("show");
    else topBtn.classList.remove("show");
  };
  toggleTop();
  window.addEventListener("scroll", toggleTop, { passive: true });
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
>>>>>>> 9fcf4e21c5988ef26d32d417ff63ee4a220c70f6
}