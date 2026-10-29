import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.firebasestorage.app",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
    };
    const db = getFirestore(initializeApp(firebaseConfig));
    const labels = { planned: "Geplant", "in-progress": "In Entwicklung", done: "Erledigt" };
    const target = document.getElementById("developmentProjects");
    function safeLink(value) {
      if (typeof value !== "string" || !value.trim()) return null;
      try { const url = new URL(value, location.href); return url.origin === location.origin || url.protocol === "https:" ? url.href : null; }
      catch { return null; }
    }
    function formatDate(value) {
      return value?.toDate ? value.toDate().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "Datum wird gespeichert …";
    }
    function renderProject(project) {
      const article = document.createElement("article"); article.className = "project"; article.dataset.status = labels[project.status] ? project.status : "planned";
      const top = document.createElement("div"); top.className = "project-top";
      const heading = document.createElement("h2"); heading.textContent = project.title || "Projekt";
      const badge = document.createElement("span"); badge.className = "status";
      const dot = document.createElement("i"); dot.className = "dot"; dot.setAttribute("aria-hidden", "true");
      badge.append(dot, document.createTextNode(labels[project.status] || "Geplant")); top.append(heading, badge);
      const description = document.createElement("p"); description.textContent = project.description || "";
      const note = document.createElement("div"); note.className = "project-note";
      const date = document.createElement("span"); date.textContent = `Angelegt: ${formatDate(project.createdAt)} · zuletzt geändert: ${formatDate(project.updatedAt || project.createdAt)}`; note.appendChild(date);
      const href = safeLink(project.link);
      if (href) {
        const link = document.createElement("a"); link.href = href; link.textContent = "  ·  Projekt ansehen ↗";
        if (new URL(href).origin !== location.origin) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
        note.appendChild(link);
      }
      article.append(top, description, note); return article;
    }
    async function loadProjects() {
      try {
        const snapshot = await getDocs(collection(db, "developmentProjects"));
        const projects = snapshot.docs.map(item => item.data());
        projects.sort((a,b) => {
          const priority = { "in-progress": 0, planned: 1, done: 2 };
          return (priority[a.status] ?? 1) - (priority[b.status] ?? 1) || (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
        });
        target.replaceChildren();
        if (!projects.length) {
          const empty = document.createElement("div"); empty.className = "loading"; empty.textContent = "Aktuell sind keine Entwicklungsprojekte eingetragen."; target.appendChild(empty); return;
        }
        projects.forEach(project => target.appendChild(renderProject(project)));
      } catch (error) {
        console.error("Entwicklungsinfos konnten nicht geladen werden", error);
        const message = document.createElement("div"); message.className = "loading";
        message.textContent = "Die Entwicklungsinfos sind gerade nicht verfügbar. Bitte später erneut versuchen."; target.replaceChildren(message);
      }
    }
    loadProjects();
