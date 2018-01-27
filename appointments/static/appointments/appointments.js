function initialize() {
  const reviewButton = document.getElementById('review-appointment');
  reviewButton.onclick = reviewAppointment;

  const editButton = document.getElementById('edit-appointment');
  editButton.onclick = editAppointment;

  const homeButton = document.getElementById('back-to-home');
  homeButton.onclick = backToHome;

  $('#appointment-form').submit(function() {

    // Remove disabled attribute in order to collect data, then re-disable them
    const disabled = $(this).find(':input:disabled').removeAttr('disabled');
    const formData = $(this).serialize();
    disabled.attr('disabled','true');

    $.ajax({
      type: 'POST',
      url: '/',
      data: formData,
      success: function() {
        $('#appointment-creation').hide();
        $('#appointment-receipt').show();
      },
      error: function(response) {

        // Display errors
        const fieldErrors = JSON.parse(response.responseText);
        const ul = document.getElementById('form-errors');
        ul.innerHTML = '';
        for (const field in fieldErrors) {
          const [text] = fieldErrors[field];
          const li = document.createElement('li');
          li.appendChild(document.createTextNode(text.message));
          ul.appendChild(li);
        }

        // Go back to editing appointment
        editAppointment();
      }
    });

    return false;
  });

}

function reviewAppointment(event) {

  // Remove packages
  const packages = document.getElementById('packages');
  packages.classList.add('hidden');

  // Change header
  const creationHeader = document.getElementById('creation-header');
  const reviewHeader = document.getElementById('review-header');
  const editHeader = document.getElementById('edit-header');
  creationHeader.classList.add('hidden');
  reviewHeader.classList.remove('hidden');
  editHeader.classList.add('hidden');

  // Change buttons
  const reviewButton = document.getElementById('review-appointment');
  const editButton = document.getElementById('edit-appointment');
  const submitButton = document.getElementById('submit-appointment');
  reviewButton.classList.add('hidden');
  editButton.classList.remove('hidden');
  submitButton.classList.remove('hidden');

  // Disable fields
  const fields = document.getElementById('appointment-form').elements;
  for (const field of fields) {
    if (field.id !== 'edit-appointment' &&
        field.id !== 'submit-appointment' &&
        field.type !== 'hidden')
    {
      field.disabled = true;
    }
  }
}

function editAppointment() {

  // Change header
  const reviewHeader = document.getElementById('review-header');
  const editHeader = document.getElementById('edit-header');
  reviewHeader.classList.add('hidden');
  editHeader.classList.remove('hidden');

  // Change buttons
  const reviewButton = document.getElementById('review-appointment');
  const editButton = document.getElementById('edit-appointment');
  const submitButton = document.getElementById('submit-appointment');
  reviewButton.classList.remove('hidden');
  editButton.classList.add('hidden');
  submitButton.classList.add('hidden');

  // Disable fields
  const fields = document.getElementById('appointment-form').elements;
  for (const field of fields) {
    field.disabled = false;
  }
}

function backToHome(event) {
  window.location = '';
}