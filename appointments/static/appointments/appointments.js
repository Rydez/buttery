function initialize() {
  const reviewButton = document.getElementById('review-appointment');
  reviewButton.onclick = reviewAppointment;

  const editButton = document.getElementById('edit-appointment');
  editButton.onclick = editAppointment;

  const homeButton = document.getElementById('back-to-home');
  homeButton.onclick = backToHome;

  // Form submit handler
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

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Package selection handler
  $('input[name=package_radio]').change(function() {

    const package_id = $('input[name=package_radio]:checked').val();
    console.log(package_id)
    $.ajax({
      type: 'GET',
      url: '/package_availabilities/',
      data: {package_id},
      success: function(availabilities) {
        $('#availability').empty();

        // Get availability contianer
        const [container] = $('#availability');
        const [months] = $('<div/>', {id: 'months'});

        container.append(months);

        // Keep track of month
        let currentMonth = '';
        let dates = null;
        for (const availability of JSON.parse(availabilities)) {
          const dateString = availability.fields.date;
          const date = new Date(dateString);
          const nextMonth = date.toLocaleString('en-us', {month: 'long'}).toLowerCase();

          // When there's a new month, make an input for it
          if (nextMonth !== currentMonth) {
            currentMonth = nextMonth;

            // Create container for dates of each month
            [dates] = $('<div/>', {
              id: `${nextMonth}-dates`,
              class: 'dates'
            });

            container.append(dates);
            $(`#${nextMonth}-dates`).hide();

            // Create label for input
            const [monthLabel] = $(`<label>${nextMonth}</label>`)

            // Create month input and put it in months div
            const [monthInput] = $('<input/>', {
              type: 'radio',
              value: nextMonth,
              id: `${nextMonth}-input`,
              name: 'months'
            });

            monthLabel.append(monthInput)
            months.append(monthLabel);
          }

          // Create label for input
          const [dateLabel] = $(`<label>${days[date.getDay()]}, ${date.getDate()}</label>`)

          // Always append the date
          const [dateInput] = $('<input/>', {
            type: 'radio',
            value: dateString,
            name: 'dates'
          });

          dateLabel.append(dateInput)
          dates.append(dateLabel);
        }

        // Create event listener for inputs
        console.log($('input[name=months]'))
        $('input[name=months]').change(function() {

          // First, hide all showing dates
          $('.dates').hide();
          const month = this.value;
          if (this.checked) {

            // Show the one which was just checked
            $(`#${month}-dates`).show();
          }
        });
      },
      // error: function(response) {
      //   console.log(response)
      // }
    });
  });

  $('input[name=package_radio]:first').attr('checked', true);
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