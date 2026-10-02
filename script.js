(() => {
  "use strict";

  const screens = [...document.querySelectorAll(".screen")];
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "misi-anak-sederhana-v1";

  const freshState = () => ({
    station1Completed: false,
    station2Completed: false,
    station3Completed: false,
    station4Completed: false,
    emotionSelected: ""
  });

  let state = loadState();

  function loadState() {
    try {
      return { ...freshState(), ...JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return freshState();
    }
  }

  function saveState() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderStars();
  }

  function completedCount() {
    return ["station1Completed","station2Completed","station3Completed","station4Completed"]
      .filter(key => state[key]).length;
  }

  function renderStars() {
    const n = completedCount();
    $("stars").textContent = Array.from({length:4}, (_,i) => i < n ? "⭐" : "☆").join(" ");
    $("stars").setAttribute("aria-label", n + " daripada 4 bintang");
  }

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle("active", s.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = id === "home" ? "Misi Anak Sederhana" : "Misi Anak Sederhana • " + id;
  }

  function nextIncompleteScreen() {
    if (!state.station1Completed) return "water";
    if (!state.station2Completed) return "electric";
    if (!state.station3Completed) return "food";
    if (!state.station4Completed) return "money";
    return "end";
  }

  function completeStation(key, next) {
    state[key] = true;
    saveState();
    celebrateMini();
    setTimeout(() => showScreen(next), 900);
  }

  function setFeedback(el, message, type = "success") {
    el.textContent = message;
    el.className = "feedback " + type;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ms-MY";
    utter.rate = 0.9;
    utter.pitch = 1.05;
    const voices = speechSynthesis.getVoices();
    const msVoice = voices.find(v => /^ms(-|_)/i.test(v.lang));
    if (msVoice) utter.voice = msVoice;
    speechSynthesis.speak(utter);
  }

  function speakCurrent() {
    const current = document.querySelector(".screen.active");
    if (!current) return;
    speak(current.dataset.speech || current.innerText.slice(0, 500));
  }

  function celebrateMini() {
    const stars = $("stars");
    stars.animate?.(
      [{transform:"scale(1)"},{transform:"scale(1.25)"},{transform:"scale(1)"}],
      {duration:500}
    );
  }

  $("startBtn").addEventListener("click", () => showScreen(nextIncompleteScreen()));
  $("homeBtn").addEventListener("click", () => showScreen("home"));
  $("menuBtn").addEventListener("click", () => showScreen("home"));
  $("soundBtn").addEventListener("click", speakCurrent);
  document.querySelectorAll(".speak-page").forEach(btn => btn.addEventListener("click", speakCurrent));

  function resetAll() {
    state = freshState();
    sessionStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
  $("resetBtn").addEventListener("click", resetAll);
  $("replayBtn").addEventListener("click", resetAll);

  const waterSituations = [
    "Kamu baru selesai membasuh tangan.",
    "Kamu baru selesai menggosok gigi.",
    "Kamu baru selesai mencuci."
  ];
  let waterIndex = 0;
  let tapClosed = false;

  $("closeTapBtn").addEventListener("click", () => {
    if (tapClosed) return;
    tapClosed = true;
    $("waterStream").classList.add("off");
    setFeedback($("waterFeedback"), "✅ BETUL! Tutup pili selepas guna.");
    speak("Betul! Tutup pili selepas guna. Guna air secukupnya.");
    $("waterQuiz").classList.remove("hidden");
    $("waterSituation").textContent = waterSituations[waterIndex];
  });

  document.querySelectorAll("[data-water-choice]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.waterChoice === "open") {
        setFeedback($("waterQuizFeedback"), "💧 Cuba lagi. Air akan membazir jika pili dibiarkan terbuka.", "hint");
        speak("Cuba lagi. Air akan membazir jika pili dibiarkan terbuka.");
        return;
      }
      waterIndex++;
      if (waterIndex < waterSituations.length) {
        setFeedback($("waterQuizFeedback"), "👏 BAGUS! Guna air secukupnya.");
        setTimeout(() => {
          $("waterSituation").textContent = waterSituations[waterIndex];
          $("waterQuizFeedback").textContent = "";
        }, 600);
      } else {
        setFeedback($("waterQuizFeedback"), "⭐ MISI AIR SELESAI!");
        speak("Misi air selesai! Guna air secukupnya. Tutup pili selepas guna!");
        completeStation("station1Completed", "electric");
      }
    });
  });

  const deviceButtons = [...document.querySelectorAll(".device")];

  deviceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("on");
      btn.classList.toggle("off");
      const on = btn.classList.contains("on");
      btn.querySelector("em").textContent = on ? "ON" : "OFF";
      btn.setAttribute("aria-label", btn.querySelector("b").textContent + ", " + (on ? "hidup" : "ditutup"));

      if (deviceButtons.every(d => d.classList.contains("off"))) {
        setFeedback($("electricFeedback"), "🌟 Hebat! Kita tidak membazir elektrik.");
        $("electricKbat").classList.remove("hidden");
        speak("Hebat! Semua peralatan sudah ditutup. Sekarang fikir: Aina sedang membaca buku di bilik gelap. Perlukah lampu ditutup?");
      } else {
        setFeedback($("electricFeedback"), "Tekan semua peralatan yang masih ON.", "hint");
      }
    });
  });

  document.querySelectorAll("[data-kbat]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.kbat === "yes") {
        setFeedback($("kbatFeedback"), "💡 Fikir sekali lagi. Aina masih memerlukan cahaya untuk membaca.", "hint");
        return;
      }
      setFeedback($("kbatFeedback"), "✅ Betul! Lampu masih diperlukan untuk membaca. GUNAKAN APABILA PERLU.");
      speak("Betul! Lampu masih diperlukan untuk membaca. Gunakan apabila perlu.");
      completeStation("station2Completed", "food");
    });
  });

  const foods = [
    {id:"rice", icon:"🍚", name:"Nasi"},
    {id:"chicken", icon:"🍗", name:"Ayam"},
    {id:"veg", icon:"🥦", name:"Sayur"},
    {id:"fruit", icon:"🍉", name:"Buah"},
    {id:"bread", icon:"🥪", name:"Roti"},
    {id:"cake", icon:"🧁", name:"Kuih"},
    {id:"drink", icon:"🥤", name:"Minuman"}
  ];
  const selectedFoods = new Set();

  foods.forEach(food => {
    const btn = document.createElement("button");
    btn.className = "food-card";
    btn.type = "button";
    btn.dataset.food = food.id;
    btn.setAttribute("aria-pressed","false");
    btn.innerHTML = "<span>" + food.icon + "</span>" + food.name;
    btn.addEventListener("click", () => toggleFood(btn, food));
    $("foodTray").appendChild(btn);
  });

  function toggleFood(btn, food) {
    if (selectedFoods.has(food.id)) selectedFoods.delete(food.id);
    else selectedFoods.add(food.id);
    const selected = selectedFoods.has(food.id);
    btn.classList.toggle("selected", selected);
    btn.setAttribute("aria-pressed", String(selected));
    renderFoodPlate();
  }

  function renderFoodPlate() {
    const chosen = foods.filter(f => selectedFoods.has(f.id));
    $("foodCount").textContent = chosen.length;
    $("plateItems").textContent = chosen.length ? chosen.map(f => f.icon).join(" ") : "PINGGAN";
  }

  $("checkFoodBtn").addEventListener("click", () => {
    const n = selectedFoods.size;
    if (n > 4) {
      setFeedback($("foodFeedback"), "🍽️ Pinggan terlalu penuh! Cuba ambil secukupnya.", "hint");
      return;
    }
    if (n < 3) {
      setFeedback($("foodFeedback"), "🙂 Pilih 3 atau 4 makanan sahaja.", "hint");
      return;
    }
    setFeedback($("foodFeedback"), "✅ BAGUS! Saya ambil makanan secukupnya.");
    $("plateCompare").classList.remove("hidden");
    speak("Bagus! Sekarang pilih pinggan yang menunjukkan sikap sederhana.");
  });

  document.querySelectorAll("[data-plate]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.plate === "b") {
        setFeedback($("plateFeedback"), "🤔 Fikir sekali lagi. Pinggan itu terlalu penuh.", "hint");
        return;
      }
      setFeedback($("plateFeedback"), "✅ Betul! Ambil makanan yang kita boleh habiskan.");
      $("foodWhy").classList.remove("hidden");
    });
  });

  document.querySelectorAll("[data-why]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.why === "full") {
        setFeedback($("whyFeedback"), "💭 Hampir betul. Fikir tentang makanan yang tidak habis.", "hint");
        return;
      }
      setFeedback($("whyFeedback"), "👏 Betul! Mengambil terlalu banyak boleh menyebabkan pembaziran.");
      $("emotionBlock").classList.remove("hidden");
      speak("Betul! Bagaimana perasaan kamu apabila tidak membazir makanan?");
    });
  });

  document.querySelectorAll("[data-emotion]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-emotion]").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.emotionSelected = btn.dataset.emotion;
      saveState();
      $("emotionSentence").textContent =
        "Saya berasa " + state.emotionSelected + " kerana saya tidak membazir makanan.";
      speak($("emotionSentence").textContent + " Misi makanan selesai!");
      setTimeout(() => completeStation("station3Completed", "money"), 650);
    });
  });

  const shop = [
    {id:"bread", icon:"🍞", name:"Roti", price:2, need:true},
    {id:"water", icon:"💧", name:"Air", price:1, need:true},
    {id:"pencil", icon:"✏️", name:"Pensel", price:1, need:true},
    {id:"candy", icon:"🍭", name:"Gula-gula", price:2, need:false},
    {id:"toy", icon:"🧸", name:"Mainan", price:5, need:false}
  ];
  const selectedShop = new Set();

  shop.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "shop-card";
    btn.type = "button";
    btn.dataset.shop = item.id;
    btn.setAttribute("aria-pressed","false");
    btn.innerHTML = "<span>" + item.icon + "</span>" + item.name + "<br>RM" + item.price;
    btn.addEventListener("click", () => {
      if (selectedShop.has(item.id)) selectedShop.delete(item.id);
      else selectedShop.add(item.id);
      btn.classList.toggle("selected", selectedShop.has(item.id));
      btn.setAttribute("aria-pressed", String(selectedShop.has(item.id)));
      renderMoney();
    });
    $("shopItems").appendChild(btn);
  });

  function moneyTotal() {
    return shop.filter(i => selectedShop.has(i.id)).reduce((sum,i) => sum + i.price,0);
  }

  function renderMoney() {
    const total = moneyTotal();
    $("totalMoney").textContent = "RM" + total;
    $("balanceMoney").textContent = "RM" + Math.max(0, 5-total);
    if (total > 5) setFeedback($("moneyFeedback"), "💸 Wang tidak cukup. Cuba pilih barang yang diperlukan.", "hint");
    else $("moneyFeedback").textContent = "";
  }

  $("checkMoneyBtn").addEventListener("click", () => {
    const total = moneyTotal();
    if (total > 5) {
      setFeedback($("moneyFeedback"), "💸 Wang tidak cukup. Cuba pilih barang yang diperlukan.", "hint");
      return;
    }
    if (selectedShop.has("toy")) {
      setFeedback($("moneyFeedback"), "🧸 Fikir lagi. Adakah mainan itu diperlukan sekarang?", "hint");
      return;
    }
    const allNeeds = ["bread","water","pencil"].every(id => selectedShop.has(id));
    if (!allNeeds || selectedShop.size !== 3) {
      setFeedback($("moneyFeedback"), "🧠 Pilih makanan, minuman dan pensel yang kamu perlukan.", "hint");
      return;
    }
    setFeedback($("moneyFeedback"), "✅ Tepat! RM2 + RM1 + RM1 = RM4. Baki = RM1.");
    $("saveBlock").classList.remove("hidden");
    speak("Tepat! Baki kamu satu ringgit. Apa yang patut kamu lakukan dengan baki itu?");
  });

  document.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.save === "spend") {
        setFeedback($("saveFeedback"), "🐷 Fikir sekali lagi. Kita tidak perlu menghabiskan semua wang.", "hint");
        return;
      }
      $("coin").classList.add("drop");
      setFeedback($("saveFeedback"), "🌟 Hebat! Kita tidak perlu menghabiskan semua wang. Beli yang perlu, simpan baki!");
      speak("Hebat! Beli yang perlu, simpan baki. Misi wang selesai!");
      state.station4Completed = true;
      saveState();
      setTimeout(() => {
        showScreen("end");
        $("finalEmotion").textContent = state.emotionSelected
          ? "😊 Perasaan saya: " + state.emotionSelected
          : "";
        launchConfetti();
      }, 1300);
    });
  });

  function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = $("confetti");
    host.innerHTML = "";
    const colors = ["#60a5fa","#22c55e","#f59e0b","#f472b6","#8b5cf6"];
    for (let i=0;i<42;i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = (Math.random()*100) + "vw";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random()*0.8) + "s";
      piece.style.transform = "rotate(" + (Math.random()*180) + "deg)";
      host.appendChild(piece);
    }
    setTimeout(() => host.innerHTML = "", 4200);
  }

  renderStars();
  if (completedCount() === 4) {
    $("finalEmotion").textContent = state.emotionSelected ? "😊 Perasaan saya: " + state.emotionSelected : "";
  }
})();