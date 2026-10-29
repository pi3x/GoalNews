window.addEventListener("load", () => {
        const loadTime = performance.now();
        const logs = JSON.parse(localStorage.getItem("monitor_logs") || "[]");
        logs.push({
          page: window.location.pathname,
          load_time: Math.round(loadTime),
          time: new Date().toLocaleTimeString()
        });
        localStorage.setItem("monitor_logs", JSON.stringify(logs));
      });
