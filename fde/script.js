/* 企业 FDE 落地页 — 内部草案交互。表单不发送、不落库。 */
(function () {
  "use strict";

  var form = document.getElementById("pilot-form");
  var statusEl = document.getElementById("form-status");
  var loopField = document.getElementById("loop");
  var loopCount = document.getElementById("loop-count");
  var otherWrap = document.getElementById("industry-other-wrap");

  document.querySelectorAll(".faq details").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      document.querySelectorAll(".faq details").forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  function selectedIndustry() {
    var picked = form.querySelector('input[name="industry"]:checked');
    return picked ? picked.value : "";
  }

  function syncOtherIndustry() {
    var show = selectedIndustry() === "其他";
    otherWrap.hidden = !show;
    if (!show) {
      var extra = document.getElementById("industry-other");
      if (extra) extra.value = "";
    }
  }

  form.querySelectorAll('input[name="industry"]').forEach(function (input) {
    input.addEventListener("change", syncOtherIndustry);
  });

  function updateCount() {
    loopCount.textContent = String(loopField.value.length);
  }

  loopField.addEventListener("input", updateCount);
  updateCount();

  function setError(id, message) {
    var field = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (!field || !error) return;
    if (message) {
      field.setAttribute("aria-invalid", "true");
      error.hidden = false;
      error.textContent = message;
    } else {
      field.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
    }
  }

  function setGroupError(name, message) {
    var error = document.getElementById(name + "-error");
    var group = document.getElementById(name + "-group");
    if (!error || !group) return;
    if (message) {
      group.setAttribute("aria-invalid", "true");
      error.hidden = false;
      error.textContent = message;
    } else {
      group.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
    }
  }

  function trimmed(id) {
    return document.getElementById(id).value.trim();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var firstInvalid = null;
    var name = trimmed("org-name");
    var loop = trimmed("loop");
    var contact = trimmed("contact-channel");
    var industry = selectedIndustry();

    var nameMsg = name ? "" : "请填写称呼，或公司／门店名。";
    var industryMsg = industry ? "" : "请选择行业。";
    var loopMsg = loop ? "" : "请用一句话写下最想跑通的日闭环。";
    var contactMsg = contact ? "" : "请留下微信或手机（仅页面占位，不会发出）。";

    setError("org-name", nameMsg);
    setGroupError("industry", industryMsg);
    setError("loop", loopMsg);
    setError("contact-channel", contactMsg);

    if (nameMsg) firstInvalid = document.getElementById("org-name");
    else if (industryMsg) firstInvalid = form.querySelector('input[name="industry"]');
    else if (loopMsg) firstInvalid = loopField;
    else if (contactMsg) firstInvalid = document.getElementById("contact-channel");

    if (firstInvalid) {
      statusEl.textContent = "还有必填项没写。此表单仍是占位，填写后也不会发送。";
      statusEl.className = "form-status is-error";
      firstInvalid.focus();
      return;
    }

    statusEl.textContent =
      "已留在这一页上，没有发送。这是占位表单，没有后端，也不会保存到服务器。价格、签约主体和排期仍待确认；我们不会凭这次点击报价或签约。";
    statusEl.className = "form-status is-local";
    var submitBtn = document.getElementById("submit-btn");
    submitBtn.focus();
  });
})();
