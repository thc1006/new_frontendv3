const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");
const passwordError = document.getElementById("password-error");
const confirmError = document.getElementById("confirm-error");

password.addEventListener("input", function () {
  const isValid = this.checkValidity();
  if (isValid) {
    this.classList.remove("is-invalid");
    this.classList.add("is-valid");
    passwordError.style.display = "none";
  } else {
    this.classList.remove("is-valid");
    this.classList.add("is-invalid");
    passwordError.style.display = "block";
  }
  checkPasswordMatch();
});

confirmPassword.addEventListener("input", checkPasswordMatch);

function checkPasswordMatch() {
  if (confirmPassword.value === "") {
    confirmPassword.classList.remove("is-valid", "is-invalid");
    confirmError.style.display = "none";
    return;
  }

  if (password.value === confirmPassword.value) {
    confirmPassword.classList.remove("is-invalid");
    confirmPassword.classList.add("is-valid");
    confirmError.style.display = "none";
  } else {
    confirmPassword.classList.remove("is-valid");
    confirmPassword.classList.add("is-invalid");
    confirmError.style.display = "block";
  }
}

document.querySelector("form").addEventListener("submit", function (e) {
  const isPasswordValid = password.checkValidity();
  const isPasswordMatch = password.value === confirmPassword.value;

  if (!isPasswordValid || !isPasswordMatch) {
    e.preventDefault();
    // alert("請確保所有欄位都符合要求");
    return false;
  }
});
