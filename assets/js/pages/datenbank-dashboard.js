import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { 
      getFirestore, collection, getDocs, doc, getDoc, query, orderBy
    } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

    // 🔹 Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.appspot.com",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const dashboard = document.getElementById("dashboard");

    // 🔹 Collections, die angezeigt werden sollen
    const collectionsToShow = ["comments", "visits", "users", "polls", "reports", "ideas", "feedback", "features", "tipps"];

    async function loadDashboard() {
      dashboard.innerHTML = "";
      for (const collName of collectionsToShow) {
        const container = document.createElement("div");
        container.className = "collection-container";
        const title = document.createElement("h2");
        title.textContent = collName.toUpperCase();
        container.appendChild(title);

        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const div = document.createElement("div");
          div.className = "doc";
          const pre = document.createElement("pre");
          pre.textContent = JSON.stringify(data, null, 2);
          div.appendChild(pre);
          container.appendChild(div);
        }

        dashboard.appendChild(container);
      }
    }

    const ADMIN_UIDS = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];
    onAuthStateChanged(auth, (user) => {
      if (!user || !ADMIN_UIDS.includes(user.uid)) {
        dashboard.textContent = "Kein Adminzugriff.";
        return;
      }
      loadDashboard();
    });

    // Admin-Ansicht in größeren Abständen aktualisieren.
    setInterval(() => {
      if (auth.currentUser && ADMIN_UIDS.includes(auth.currentUser.uid)) loadDashboard();
    }, 60000);
