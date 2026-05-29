const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      mobileMenu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const submitButton = contactForm.querySelector('button[type="submit"]');

    formData.set("_replyto", String(formData.get("contact") || "").trim());
    formData.set("submittedAt", new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    }));

    if (submitButton) {
      submitButton.disabled = true;
    }
    formNote.textContent = "Sending your interest...";

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      formNote.textContent = name
        ? `Thanks, ${name}. Your interest has been sent to Men of Stone.`
        : "Thanks. Your interest has been sent to Men of Stone.";
      contactForm.reset();
    } catch (error) {
      formNote.textContent =
        "Sorry, the form could not send just now. Please email men.of.stoneuk@gmail.com.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
