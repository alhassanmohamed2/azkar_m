let data;
let main_text = document.querySelector(".main-text");
let counter_button = document.querySelector("#counter");
let ziker_done_count = document.querySelector("#ziker_done_count");
let totle_ziker = document.querySelector("#totle_ziker");
let box = document.querySelector(".box");
let counter_track = 0;
let header = document.querySelector("header");
let ul_links = document.querySelector("header ul");
let icon = document.querySelector("header .icon");
let spans = document.querySelector("header .icon span");
let menu_active = false;
let ziker_name = document.querySelector("#ziker_name");
let azkar_names = [
  "أذكار الصباح",
  "أذكار المساء",
  "أذكار الصلاة",
  "صيغ التشهد",
];
let currentAzkarIndex = 0;

let azkar_alsaba7 = document.querySelector("#azkar_alsaba7");
let azkar_almsa2 = document.querySelector("#azkar_almsa2");
let azkar_alslah = document.querySelector("#azkar_alslah");
let azkar_altshhd = document.querySelector("#azkar_altshhd");
let times = document.querySelector("#times");

icon.addEventListener("click", function (e) {
  e.stopPropagation();
  if (!menu_active) {
    menu_active = true;
    header.style.overflow = "visible";
    icon.classList.add("active-icon");
    ul_links.classList.add("move-to-left");
  } else {
    menu_active = false;
    header.style.overflow = "hidden";
    icon.classList.remove("active-icon");
    ul_links.classList.remove("move-to-left");
  }
});

document.addEventListener("click", (e) => {
  if (!icon.contains(e.target) && !ul_links.contains(e.target)) {
    if (menu_active) {
      menu_active = false;
      header.style.overflow = "hidden";
      icon.classList.remove("active-icon");
      ul_links.classList.remove("move-to-left");
    }
  }
});

document.onkeyup = function (e) {
  if (e.key === "Escape") {
    menu_active = false;
    header.style.overflow = "hidden";
    icon.classList.remove("active-icon");
    ul_links.classList.remove("move-to-left");
  } else if (e.key === "ArrowLeft") {
    next_action();
  } else if (e.key === "ArrowRight") {
    back_action();
  } else if (e.key === " " || e.key === "Enter") {
    count_action();
  }
};

// Theme and Time of day detection
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = themeToggleBtn.querySelector("i");
const currentHour = new Date().getHours();
let isNightTime = currentHour >= 17 || currentHour < 5;

let savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || (!savedTheme && isNightTime)) {
  document.body.classList.add("dark-mode");
  themeIcon.className = "fa-solid fa-sun";
} else {
  document.body.classList.remove("dark-mode");
  themeIcon.className = "fa-solid fa-moon";
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    themeIcon.className = "fa-solid fa-sun";
    localStorage.setItem("theme", "dark");
  } else {
    themeIcon.className = "fa-solid fa-moon";
    localStorage.setItem("theme", "light");
  }
});

// Progress Tracking Methods
function getProgressKey(azkarIndex) {
  const now = new Date();
  
  if (azkarIndex === 2 || azkarIndex === 3) {
    const timingsStr = localStorage.getItem("prayer_timings");
    if (!timingsStr) return `azkar_salah_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
    
    const timings = JSON.parse(timingsStr);
    const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    let lastPrayer = "Isha"; 
    let prayerDate = now.getDate();
    
    for (let p of prayerNames) {
      if (!timings[p]) continue;
      let parts = timings[p].split(":");
      let pTime = new Date();
      pTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      if (now >= pTime) lastPrayer = p;
    }
    
    if (lastPrayer === "Isha" && now.getHours() < 12) {
      prayerDate = new Date(now.getTime() - 24*60*60*1000).getDate();
    }
    return `azkar_salah_${now.getFullYear()}_${now.getMonth()}_${prayerDate}_${lastPrayer}`;
  } 
  else if (azkarIndex === 0) {
    const shifted = new Date(now.getTime() - 4*60*60*1000); // Morning resets at 4 AM
    return `azkar_morning_${shifted.getFullYear()}_${shifted.getMonth()}_${shifted.getDate()}`;
  }
  else {
    const shifted = new Date(now.getTime() - 14*60*60*1000); // Evening resets at 2 PM (Asr)
    return `azkar_evening_${shifted.getFullYear()}_${shifted.getMonth()}_${shifted.getDate()}`;
  }
}

function clearOldProgress() {
  const validKeys = [0, 1, 2, 3].map(getProgressKey);
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("azkar_salah_") || k.startsWith("azkar_morning_") || k.startsWith("azkar_evening_") || k.startsWith("azkar_progress_"))) {
      if (!validKeys.includes(k)) keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
clearOldProgress();

function loadProgress(azkarIndex) {
  const key = getProgressKey(azkarIndex);
  let progress = localStorage.getItem(key);
  return progress ? JSON.parse(progress) : {};
}

function saveProgress(azkarIndex, zikrId, remainingCount) {
  const key = getProgressKey(azkarIndex);
  let progress = loadProgress(azkarIndex);
  progress[zikrId] = remainingCount;
  localStorage.setItem(key, JSON.stringify(progress));
}

function getZakrProgress(azkarIndex, zikrId, defaultCount) {
  let progress = loadProgress(azkarIndex);
  return progress[zikrId] !== undefined ? progress[zikrId] : defaultCount;
}

function isZakrDone(azkarIndex, zikrId) {
  let progress = loadProgress(azkarIndex);
  return progress[zikrId] === true || progress[zikrId] === 0;
}

// Give each item a stable ID based on original position
[day_data, night_data, azkat_salah, tashahd].forEach((arr) => {
  arr.forEach((item, index) => {
    if (item.id === undefined) {
      item.id = index;
    }
  });
});

function sortAzkarArray(arr, azkarIndex) {
  arr.sort((a, b) => {
    let aDone = isZakrDone(azkarIndex, a.id) ? 1 : 0;
    let bDone = isZakrDone(azkarIndex, b.id) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return a.count - b.count;
  });
}

// Sort all data
sortAzkarArray(day_data, 0);
sortAzkarArray(night_data, 1);
sortAzkarArray(azkat_salah, 2);
sortAzkarArray(tashahd, 3);

// Select initial data based on time of day
currentAzkarIndex = isNightTime ? 1 : 0;
data = isNightTime ? night_data : day_data;

function renderProgressBar() {
  let html = "";
  let doneCount = 0;
  
  let total = data.length;
  // Loop through the sorted array sequentially so the progress bar perfectly matches the current reading sequence
  for (let i = 0; i < total; i++) {
    let item = data[i];
    let isDone = isZakrDone(currentAzkarIndex, item.id);
    if (isDone) doneCount++;
    
    let isActive = (counter_track === i);
    
    let className = "progress-segment";
    if (isDone) className += " done";
    if (isActive) className += " active";
    
    html += `<div class="${className}"></div>`;
  }
  
  document.getElementById("progress-bar").innerHTML = html;
  document.getElementById("ziker_done_count").innerText = doneCount;
}

function renderZakr() {
  // Reset animation
  main_text.classList.remove("fade-in");
  void main_text.offsetWidth; // trigger reflow
  main_text.classList.add("fade-in");

  main_text.innerHTML = data[counter_track]['zakr'];
  totle_ziker.innerHTML = data.length;
  // Render the new progress bar and update completed count
  renderProgressBar();
  
  ziker_name.innerHTML = azkar_names[currentAzkarIndex];
  
  if (isZakrDone(currentAzkarIndex, data[counter_track].id)) {
    counter_button.innerHTML = "✔";
    times.innerHTML = "";
  } else {
    counter_button.innerHTML = getZakrProgress(currentAzkarIndex, data[counter_track].id, data[counter_track]['count']);
    times.innerHTML = data[counter_track]['text_count'];
  }
}

renderZakr();

let next = document.querySelector("#next");
let back = document.querySelector("#back");

next.addEventListener("click", next_action);
back.addEventListener("click", back_action);
azkar_alsaba7.addEventListener("click", () => {
  choose_azkar(day_data, 0);
});
azkar_almsa2.addEventListener("click", () => {
  choose_azkar(night_data, 1);
});
azkar_alslah.addEventListener("click", () => {
  choose_azkar(azkat_salah, 2);
});
azkar_altshhd.addEventListener("click", () => choose_azkar(tashahd, 3));

function choose_azkar(azkar_data, azkar_number) {
  data = azkar_data;
  currentAzkarIndex = azkar_number;
  counter_track = 0;
  renderZakr();
}

function next_action() {
  if (counter_track < data.length - 1) {
    counter_track++;
    renderZakr();
  }
}

function back_action() {
  if (counter_track > 0) {
    counter_track--;
    renderZakr();
  }
}

counter_button.addEventListener("click", count_action);

function count_action() {
  if (counter_button.innerHTML === "✔") {
    let allDone = data.every(item => isZakrDone(currentAzkarIndex, item.id));
    if (allDone) {
      main_text.innerHTML = "تم الانتهاء، تقبل الله منا ومنكم صالح الأعمال.";
      times.innerHTML = "";
    } else {
      next_action();
    }
    return;
  }

  if (counter_button.innerHTML == 1) {
    saveProgress(currentAzkarIndex, data[counter_track].id, 0);
    counter_button.innerHTML = "✔";
    times.innerHTML = "";
    
    // Automatically re-sort and show next after a short delay
    setTimeout(() => {
      sortAzkarArray(data, currentAzkarIndex);
      
      let allDone = data.every(item => isZakrDone(currentAzkarIndex, item.id));
      if (allDone) {
        main_text.innerHTML = "تم الانتهاء، تقبل الله منا ومنكم صالح الأعمال.";
        times.innerHTML = "";
        counter_button.innerHTML = "✔";
      } else {
        if (counter_track >= data.length) counter_track = data.length - 1;
        // If the item at current track is already done (meaning we hit the end of unfinished items)
        if (isZakrDone(currentAzkarIndex, data[counter_track].id)) {
          counter_track = 0; // jump back to the first unfinished item
        }
        renderZakr();
      }
    }, 300);
    
  } else if (counter_button.innerHTML > 0) {
    counter_button.innerHTML--;
    saveProgress(currentAzkarIndex, data[counter_track].id, parseInt(counter_button.innerHTML));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  box.addEventListener("click", chooseSide);
  fetchPrayerTimesAndUpdate(); // Fetch real prayer times on load
});

function chooseSide(e) {
  const { clientX } = e;
  const { left, width } = box.getBoundingClientRect();
  const relativeX = clientX - left;

  if (relativeX < width / 2) {
    next_action();
  } else {
    back_action();
  }
}

async function fetchPrayerTimesAndUpdate() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchAndApplyTimings(latitude, longitude);
      },
      async (error) => {
        console.log("Geolocation denied or failed, falling back to IP.");
        await fetchByIP();
      }
    );
  } else {
    await fetchByIP();
  }
}

async function fetchByIP() {
  try {
    const geoResponse = await fetch("https://get.geojs.io/v1/ip/geo.json");
    if (!geoResponse.ok) return;
    const geoData = await geoResponse.json();
    await fetchAndApplyTimings(geoData.latitude, geoData.longitude);
  } catch (error) {
    console.error("Could not fetch IP location", error);
  }
}

async function fetchAndApplyTimings(latitude, longitude) {
  try {
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}`;

    const adhanResponse = await fetch(url);
    if (!adhanResponse.ok) return;
    const adhanData = await adhanResponse.json();
    const timings = adhanData.data.timings;
    localStorage.setItem("prayer_timings", JSON.stringify(timings));

    const fajrTime = timings.Fajr;
    const asrTime = timings.Asr;

    const fajrParts = fajrTime.split(':');
    const fajrDate = new Date();
    fajrDate.setHours(parseInt(fajrParts[0], 10), parseInt(fajrParts[1], 10), 0, 0);

    const asrParts = asrTime.split(':');
    const asrDate = new Date();
    asrDate.setHours(parseInt(asrParts[0], 10), parseInt(asrParts[1], 10), 0, 0);

    const now = new Date();

    // Day time is from Fajr to Asr
    const isDayTimeAPI = now >= fajrDate && now < asrDate;
    const isNightTimeAPI = !isDayTimeAPI;

    if (isNightTime !== isNightTimeAPI) {
      isNightTime = isNightTimeAPI;
      currentAzkarIndex = isNightTime ? 1 : 0;
      data = isNightTime ? night_data : day_data;

      counter_track = 0;
      renderZakr();

      if (!localStorage.getItem("theme")) {
        if (isNightTime) {
          document.body.classList.add("dark-mode");
          themeIcon.className = "fa-solid fa-sun";
        } else {
          document.body.classList.remove("dark-mode");
          themeIcon.className = "fa-solid fa-moon";
        }
      }
    }
  } catch (error) {
    console.error("Could not fetch prayer times", error);
  }
}

// History Modal Logic
let show_history = document.getElementById("show_history");
let history_modal = document.getElementById("history-modal");
let close_modal = document.querySelector(".close-modal");
let history_stats = document.getElementById("history-stats");

function updateHistoryUI() {
  const allData = [day_data, night_data, azkat_salah, tashahd];
  history_stats.innerHTML = "";
  
  azkar_names.forEach((name, index) => {
    let total = allData[index].length;
    let doneCount = 0;
    
    for (let i = 0; i < total; i++) {
      if (isZakrDone(index, i)) doneCount++;
    }
    
    const div = document.createElement("div");
    div.className = "stat-item";
    div.innerHTML = `<span>${name}</span> <span><b style="color: var(--primary)">${doneCount}</b> / ${total}</span>`;
    history_stats.appendChild(div);
  });
}

show_history.addEventListener("click", () => {
  // Close menu if open
  menu_active = false;
  header.style.overflow = "hidden";
  icon.classList.remove("active-icon");
  ul_links.classList.remove("move-to-left");
  
  updateHistoryUI();
  history_modal.classList.add("show");
});

close_modal.addEventListener("click", () => {
  history_modal.classList.remove("show");
});

window.addEventListener("click", (e) => {
  if (e.target == history_modal) {
    history_modal.classList.remove("show");
  }
});

// Notification System
let notifyBtn = document.getElementById("toggle_notifications");
let notifyIcon = notifyBtn.querySelector("i");
let notificationsEnabled = localStorage.getItem("notificationsEnabled") === "true";

function updateNotifyUI() {
  if (notificationsEnabled) {
    notifyIcon.className = "fa-solid fa-bell";
    notifyIcon.style.color = "var(--primary)";
  } else {
    notifyIcon.className = "fa-solid fa-bell-slash";
    notifyIcon.style.color = "inherit";
  }
}
updateNotifyUI();

notifyBtn.addEventListener("click", () => {
  if (!notificationsEnabled) {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          notificationsEnabled = true;
          localStorage.setItem("notificationsEnabled", "true");
          updateNotifyUI();
          new Notification("تم التفعيل", { body: "سيتم تنبيهك بأوقات الأذكار طالما المتصفح مفتوح أو يعمل في الخلفية." });
        } else {
          alert("الرجاء السماح بالإشعارات من إعدادات المتصفح.");
        }
      });
    } else {
      alert("متصفحك لا يدعم الإشعارات.");
    }
  } else {
    notificationsEnabled = false;
    localStorage.setItem("notificationsEnabled", "false");
    updateNotifyUI();
  }
});

setInterval(() => {
  if (!notificationsEnabled) return;
  const timingsStr = localStorage.getItem("prayer_timings");
  if (!timingsStr) return;
  
  const timings = JSON.parse(timingsStr);
  const now = new Date();
  const prayerNames = { "Fajr": "الفجر", "Dhuhr": "الظهر", "Asr": "العصر", "Maghrib": "المغرب", "Isha": "العشاء" };
  
  for (let [key, name] of Object.entries(prayerNames)) {
    if (!timings[key]) continue;
    let parts = timings[key].split(":");
    let pTime = new Date();
    pTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    
    let diffMs = now.getTime() - pTime.getTime();
    // Notify within the first minute of the prayer time
    if (diffMs > 0 && diffMs < 60000) {
      let notifiedKey = `notified_${now.getDate()}_${key}`;
      if (!localStorage.getItem(notifiedKey)) {
        localStorage.setItem(notifiedKey, "true");
        
        let title = `حان وقت أذكار ما بعد صلاة ${name}`;
        let body = "لا تنس قراءة أذكار الصلاة.";
        if (key === "Fajr") body = "حان وقت أذكار ما بعد صلاة الفجر وأذكار الصباح.";
        if (key === "Asr") body = "حان وقت أذكار ما بعد صلاة العصر وأذكار المساء.";
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: body });
        }
      }
    }
  }
}, 30000);

// Font Size Adjuster
let fontSlider = document.getElementById("font-size-slider");

// Load saved font size
let savedFontSize = localStorage.getItem("azkar_font_size");
if (savedFontSize) {
  fontSlider.value = savedFontSize;
  main_text.style.fontSize = savedFontSize + "px";
} else {
  // Default is 26px
  main_text.style.fontSize = "26px";
  fontSlider.value = "26";
}

fontSlider.addEventListener("input", (e) => {
  let newSize = e.target.value;
  main_text.style.fontSize = newSize + "px";
  localStorage.setItem("azkar_font_size", newSize);
});
