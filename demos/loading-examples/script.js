const replayButton = document.getElementById("replay-all");
const gallery = document.querySelector(".gallery");
const choices = document.querySelectorAll('input[name="loader-choice"]');

replayButton.addEventListener("click", () => {
  gallery.classList.remove("is-replaying");
  void gallery.offsetWidth;
  gallery.classList.add("is-replaying");
  window.setTimeout(() => gallery.classList.remove("is-replaying"), 500);
});

choices.forEach((choice) => {
  choice.addEventListener("change", () => {
    document.querySelectorAll("[data-example]").forEach((example) => {
      example.classList.remove("is-selected");
    });
    choice.closest("[data-example]").classList.add("is-selected");
  });
});
