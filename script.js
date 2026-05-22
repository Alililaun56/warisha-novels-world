import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

// =====================
// FIREBASE CONFIG
// =====================
const firebaseConfig = {
  apiKey: "AIzaSyDFW62ReV0d7oU07iTd_UGfMqMly7iZMG8",
  authDomain: "warisha-novels-world.firebaseapp.com",
  projectId: "warisha-novels-world",
  storageBucket: "warisha-novels-world.firebasestorage.app",
  messagingSenderId: "730509359637",
  appId: "1:730509359637:web:27a0e9ad2eb0196ed92c1c",
  measurementId: "G-91RMFW4V74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================
// USER (demo)
// =====================
const userId = "user1";
let userCoins = 100;

// =====================
// SOCIAL LINKS
// =====================
const socialLinks = {
  tiktok: "https://www.tiktok.com/@warisha3956",
  youtube: "https://youtube.com/@novelhirmaan?si=lNzRxi7dUm0f8d9i"
};

// =====================
// SOCIAL BUTTONS
// =====================
document.getElementById("btnTiktok")?.addEventListener("click", () => {
  window.open(socialLinks.tiktok, "_blank");
});

document.getElementById("btnYoutube")?.addEventListener("click", () => {
  window.open(socialLinks.youtube, "_blank");
});

// =====================
// FETCH NOVELS
// =====================
async function fetchNovels() {
  const container = document.getElementById("novelContainer");
  container.innerHTML = "";

  const snap = await getDocs(collection(db, "novels"));

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const isUnlocked = data.unlockedBy?.includes(userId);
    const qist = data.qist || {};
    const qistPaid = qist.paidUsers?.includes(userId);

    let button = "";

    // =====================
    // LOGIC
    // =====================
    if (isUnlocked) {
      button = `<button onclick="openNovel('${id}')">📖 Read</button>`;
    }
    else if (qist.active && !qistPaid) {
      button = `<button onclick="payQist('${id}', ${qist.perInstallment})">
        💳 Pay Qist (${qist.perInstallment})
      </button>`;
    }
    else {
      button = `<button onclick="unlockNovel('${id}', ${data.unlockCost})">
        🔒 Unlock (${data.unlockCost})
      </button>`;
    }

    const card = document.createElement("div");
    card.className = "novel-card";

    card.innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.description}</p>
      ${button}
    `;

    container.appendChild(card);
  });
}

// =====================
// OPEN NOVEL
// =====================
window.openNovel = async function (id) {
  const ref = doc(db, "novels", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    alert("📖 Opening: " + snap.data().title);
  }
};

// =====================
// FULL UNLOCK
// =====================
window.unlockNovel = async function (id, cost) {
  if (userCoins < cost) {
    alert("❌ Not enough coins!");
    return;
  }

  userCoins -= cost;

  const ref = doc(db, "novels", id);
  const snap = await getDoc(ref);

  let unlockedBy = snap.data().unlockedBy || [];

  if (!unlockedBy.includes(userId)) {
    unlockedBy.push(userId);
  }

  await updateDoc(ref, { unlockedBy });

  alert("✅ Novel Unlocked!");
  fetchNovels();
};

// =====================
// QIST SYSTEM
// =====================
window.payQist = async function (id, amount) {
  if (userCoins < amount) {
    alert("❌ Not enough coins for qist!");
    return;
  }

  userCoins -= amount;

  const ref = doc(db, "novels", id);
  const snap = await getDoc(ref);

  const data = snap.data();
  const qist = data.qist || {};

  let paidUsers = qist.paidUsers || [];

  if (!paidUsers.includes(userId)) {
    paidUsers.push(userId);
  }

  const completed = paidUsers.length >= qist.totalParts;

  await updateDoc(ref, {
    qist: {
      ...qist,
      paidUsers,
      completed
    }
  });

  // auto unlock if complete
  if (completed) {
    let unlockedBy = data.unlockedBy || [];

    if (!unlockedBy.includes(userId)) {
      unlockedBy.push(userId);
    }

    await updateDoc(ref, { unlockedBy });

    alert("🎉 Qist complete! Novel unlocked.");
  } else {
    alert("💳 Qist paid!");
  }

  fetchNovels();
};

// =====================
// INIT
// =====================
fetchNovels();
