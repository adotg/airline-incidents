const createDropDown = (elem, options, eventFunctions) => {
  if(document.getElementsByClassName('dropdown-button-placeholder').length === 0){
  const selectButton = document.createElement("div");
  const selectButtonPlaceholder = document.createElement("div");
  selectButtonPlaceholder.innerHTML = options[0];

  selectButton.appendChild(selectButtonPlaceholder);
  selectButtonPlaceholder.classList.add("dropdown-button-placeholder");
  selectButton.classList.add("dropdown-button");
  const selection = document.createElement("div");
  selection.classList.add("dropdown");
  let display = false;
  selection.style.display = "none";
  const showHideDropdown = () => {
    display = !display;
    selection.style.display = display ? "block" : "none";
  };

  const arrow = document.createElement("span");
  arrow.classList.add("dropdown-arrow");
  arrow.innerHTML = " &#9662";
  options.forEach(e => {
    const option = document.createElement("div");
    option.setAttribute("value", e);
    option.classList.add("dropdown-list");
    option.innerHTML = e;
    if (e === options[0]) {
      option.setAttribute("selected", true);
    }
    option.addEventListener("click", e => {
      e.stopPropagation();
      e.preventDefault();
      showHideDropdown();

      eventFunctions(e);
      selectButtonPlaceholder.innerHTML = e.srcElement.innerHTML;
      selectButtonPlaceholder.style.visibility = "visible";
      selectButtonPlaceholder.appendChild(arrow);
    });
    selection.appendChild(option);
  });

  window.addEventListener("click", e => {
    display = true;
    selectButtonPlaceholder.style.visibility = "visible";
    showHideDropdown();
  });

  selectButton.addEventListener("click", e => {
    e.stopPropagation();
    selectButtonPlaceholder.style.visibility = "hidden";
    showHideDropdown(e);
  });

  selectButtonPlaceholder.appendChild(arrow);
  selectButton.appendChild(selection);

  elem.appendChild(selectButton);
}
};
