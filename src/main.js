// Morandi palette (soft muted colors)
const morandiColors = ["#AAB8AB", "#97A5C0", "#8D8FA4", "#BFB3B3", "#D3BBB7"];

// Load CSV
async function loadCSV(path) {
  const response = await fetch(path);
  const text = await response.text();

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });

  // result.data is an array of objects { category, color, word, meaning }
  const data = [];
  result.data.forEach(row => {
    let block = data.find(b => b.category === row.category);
    if (!block) {
      block = { category: row.category, color: row.color || morandiColors[data.length % morandiColors.length], words: [] };
      data.push(block);
    }
    block.words.push({ word: row.word, meaning: row.meaning });
  });

  return data;
}


// Render blocks
function renderWordBlocks(data) {
  const container = document.getElementById("word-blocks-container");
  container.innerHTML = "";

  data.forEach((block, index) => {
    const blockDiv = document.createElement("div");
    blockDiv.className = "word-block";
    const blockId = `block-${index}`;
    blockDiv.id = blockId;

    // Title
    const title = document.createElement("div");
    title.className = "word-block-title";
    title.textContent = block.category;
    blockDiv.appendChild(title);

    // Subtle Morandi accent
    const accent = block.color;
    const style = document.createElement("style");
    style.textContent = `
      #${blockId} .word-block-title::before { 
        background: ${accent}; 
      }
      #${blockId} .word-table td {
        color: #555;
      }
      #${blockId} .word-table button {
        background-color: ${accent};
        color: #fff;
        font-weight: 500;
      }
      #${blockId} .word-table tr.pronounced td {
        background-color: ${accent}33 !important; /* semi-transparent highlight */
      }
    `;
    document.head.appendChild(style);

    // Table
    const table = document.createElement("table");
    table.className = "word-table";
    table.innerHTML = `<thead>
      <tr><th>Word</th><th>Meaning</th><th>Pron.</th></tr>
    </thead>`;
    const tbody = document.createElement("tbody");

    block.words.forEach(entry => {
      const tr = document.createElement("tr");

      // French word column
      const tdWord = document.createElement("td");
      tdWord.textContent = entry.word || ""; // empty if missing

      // Meaning column
      const tdMeaning = document.createElement("td");
      tdMeaning.textContent = entry.meaning || "";

      // Pronunciation button column
      const tdButton = document.createElement("td");

      if (entry.word && entry.word.trim() !== "") {
        // Only add button if French word exists
        const button = document.createElement("button");
        button.textContent = "🔊";
        button.onclick = () => {
          tr.classList.add("pronounced");
          setTimeout(() => tr.classList.remove("pronounced"), 700);

          const utterance = new SpeechSynthesisUtterance(entry.word);
          utterance.lang = "fr-FR";
          speechSynthesis.speak(utterance);
        };
        tdButton.appendChild(button);
      } else {
        // Leave the cell empty (or you can put a dash: "-")
        tdButton.textContent = "";
      }

      tr.appendChild(tdWord);
      tr.appendChild(tdMeaning);
      tr.appendChild(tdButton);
      tbody.appendChild(tr);
    });


    table.appendChild(tbody);
    blockDiv.appendChild(table);
    container.appendChild(blockDiv);
  });
}

// Load CSV and render
const container = document.getElementById("word-blocks-container");
// const csvPath = container.dataset.csv;
// loadCSV(csvPath).then(renderWordBlocks);

// lazy load
const cache = new Map(); // csvPath → parsed data

async function loadSection(csvPath) {
  // Already loaded → reuse
  if (cache.has(csvPath)) {
    renderWordBlocks(cache.get(csvPath));
    return;
  }

  try {
    const data = await loadCSV(csvPath);
    cache.set(csvPath, data);
    renderWordBlocks(data);
  } catch (err) {
    console.error("Failed to load:", csvPath, err);
  }
}

// // Hook up buttons
// document.querySelectorAll('#sections li').forEach(item => {
//   btn.addEventListener("click", () => {
//     // Remove active from all
//     document.querySelectorAll("#sections button").forEach(b => b.classList.remove("active"));
//     // Set active for clicked
//     btn.classList.add("active");

//     loadSection(btn.dataset.csv);
//   });
// });

const unitItems = document.querySelectorAll('#sections li[data-csv]');
unitItems.forEach(item => {
  item.addEventListener("click", () => {

    // Remove active from all
    document.querySelectorAll("#sections li")
      .forEach(li => li.classList.remove("active"));

    // Set active
    item.classList.add("active");

    // Load CSV
    const csvPath = item.dataset.csv;
    loadSection(csvPath);

    // Smooth scroll to word blocks
    const container = document.getElementById("word-blocks-container");
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});


// Auto-load first unit on page load
if (unitItems.length > 0) {
  const firstUnit = unitItems[0];
  firstUnit.classList.add("active");
  loadSection(firstUnit.dataset.csv);
}


