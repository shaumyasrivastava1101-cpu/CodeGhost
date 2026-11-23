const problemInput = document.getElementById("problem");
const languageSelect = document.getElementById("language");
const codeInput = document.getElementById("code");
const auditBtn = document.getElementById("auditBtn");
const outputEl = document.getElementById("output");
const statusText = document.getElementById("statusText");
const verdictBadge = document.getElementById("verdictBadge");
const skeletonLoader = document.getElementById("skeletonLoader");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const clearCodeBtn = document.getElementById("clearCodeBtn");
const copyFeedbackBtn = document.getElementById("copyFeedbackBtn");

const PRESETS = {
  "two-sum-opt": {
    problem: "Two Sum",
    language: "C++",
    code: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) {
            return {seen[need], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> ans = twoSum(nums, 9);
    if (!ans.empty()) {
        cout << ans[0] << " " << ans[1] << "\\n";
    }
    return 0;
}`,
  },
  "two-sum-brute": {
    problem: "Two Sum",
    language: "C++",
    code: `#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSumBrute(vector<int>& nums, int target) {
    int n = nums.size();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }
    return {};
}

int main() {
    vector<int> nums = {3, 2, 4};
    vector<int> ans = twoSumBrute(nums, 6);
    if (!ans.empty()) {
        cout << ans[0] << " " << ans[1] << "\\n";
    }
    return 0;
}`,
  },
  "valid-parens": {
    problem: "Valid Parentheses",
    language: "C++",
    code: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                return false;
            }
            st.pop();
        }
    }
    return st.empty();
}

int main() {
    cout << (isValid("()[]{}") ? "true" : "false") << "\\n";
    return 0;
}`,
  },
};

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    problemInput.value = preset.problem;
    languageSelect.value = preset.language;
    codeInput.value = preset.code;
    statusText.textContent = `Loaded preset: ${preset.problem} (${preset.language})`;
  });
});

copyCodeBtn.addEventListener("click", async () => {
  if (!codeInput.value.trim()) return;
  await navigator.clipboard.writeText(codeInput.value);
  copyCodeBtn.textContent = "Copied!";
  setTimeout(() => (copyCodeBtn.textContent = "Copy Code"), 1200);
});

clearCodeBtn.addEventListener("click", () => {
  codeInput.value = "";
  statusText.textContent = "Code cleared.";
});

copyFeedbackBtn.addEventListener("click", async () => {
  if (!outputEl.textContent.trim()) return;
  await navigator.clipboard.writeText(outputEl.textContent);
  copyFeedbackBtn.textContent = "Copied!";
  setTimeout(() => (copyFeedbackBtn.textContent = "Copy Audit"), 1200);
});

codeInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runAudit();
  }
});

function setVerdictBadge(text) {
  verdictBadge.classList.remove("hidden", "verdict-hire", "verdict-caution");
  const lower = text.toLowerCase();

  if (lower.includes("strong hire") || /\bhire\b/.test(lower.replace(/lean no|no hire/g, ""))) {
    verdictBadge.textContent = lower.includes("strong hire") ? "Strong Hire" : "Hire";
    verdictBadge.classList.add("verdict-hire");
  } else if (lower.includes("lean no") || lower.includes("no hire")) {
    verdictBadge.textContent = lower.includes("no hire") ? "No Hire" : "Lean No";
    verdictBadge.classList.add("verdict-caution");
  } else {
    verdictBadge.textContent = "Offline Fallback Audit";
    verdictBadge.classList.add("verdict-caution");
  }
}

function buildLocalFallbackAudit(problem, language, code) {
  const hasNestedLoops = /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/s.test(code);
  const usesHashMap = /unordered_map|dict|Map|Set/i.test(code);
  const timeEst = hasNestedLoops
    ? "O(n^2) — nested loops detected; may TLE on large inputs."
    : usesHashMap
    ? "O(n) average — single pass with hash lookup."
    : "O(n) or O(n log n) depending on traversal/sorting.";
  const spaceEst = usesHashMap ? "O(n) auxiliary space for lookup table." : "O(1) or O(n) depending on data structures.";

  return [
    "Note: Live AI servers were momentarily busy, so here is an instant local fallback audit.",
    "",
    "1. Time & Space Complexity (Big-O)",
    `- Time: ${timeEst}`,
    `- Space: ${spaceEst}`,
    "",
    "2. Edge Cases Missed or Handled Well",
    "- Check empty input, single-element input, duplicate values, and negative/zero numbers.",
    "- Verify what happens when no valid answer exists.",
    "",
    "3. Code Cleanliness & Optimization Suggestions",
    `- Language: ${language} | Problem: ${problem || "Unspecified"}`,
    "- Keep helper logic modular, check bounds before indexing, and explain trade-offs clearly during the walkthrough.",
    "",
    "4. Final Interview Verdict",
    "- Lean No (Fallback Mode — retry in a moment for live AI feedback).",
  ].join("\n");
}

async function fetchFromServer(prompt) {
  statusText.textContent = "Auditing via CodeGhost AI server...";
  try {
    const res = await fetch("/.netlify/functions/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (res.ok && data.text) {
      return { text: data.text, live: true };
    }
  } catch {}
  return { text: null, live: false };
}

async function runAudit() {
  const problem = problemInput.value.trim() || "Not specified";
  const language = languageSelect.value;
  const code = codeInput.value.trim();

  if (!code) {
    outputEl.classList.remove("hidden");
    skeletonLoader.classList.add("hidden");
    verdictBadge.classList.add("hidden");
    copyFeedbackBtn.classList.add("hidden");
    statusText.textContent = "Add a code snippet first.";
    outputEl.textContent = "Paste a solution or click one of the preset buttons at the top, then click Run Interview Audit.";
    return;
  }

  auditBtn.disabled = true;
  auditBtn.textContent = "Auditing...";
  outputEl.classList.add("hidden");
  skeletonLoader.classList.remove("hidden");
  verdictBadge.classList.add("hidden");
  copyFeedbackBtn.classList.add("hidden");

  const prompt = [
    "You are a strict, constructive senior software engineer conducting a technical coding interview.",
    `Language: ${language}`,
    `Problem: ${problem}`,
    "Candidate Code:",
    code,
    "",
    "Provide a concise interview audit covering:",
    "1. Time & Space Complexity (Big-O)",
    "2. Edge Cases Missed or Handled Well",
    "3. Code Cleanliness & Optimization Suggestions",
    "4. Final Interview Verdict (Strong Hire / Hire / Lean No / No Hire)",
  ].join("\n");

  const result = await fetchFromServer(prompt);
  const finalText = result.live && result.text
    ? result.text
    : buildLocalFallbackAudit(problem, language, code);

  skeletonLoader.classList.add("hidden");
  outputEl.classList.remove("hidden");
  copyFeedbackBtn.classList.remove("hidden");
  outputEl.textContent = finalText;
  setVerdictBadge(finalText);
  statusText.textContent = result.live
    ? "Live AI audit complete."
    : "Completed with local fallback (no error screen shown).";

  auditBtn.disabled = false;
  auditBtn.textContent = "Run Interview Audit";
}

auditBtn.addEventListener("click", runAudit);