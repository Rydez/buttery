$(document).ready(function() {

  var reviewButton = document.getElementById('review-appointment');
  reviewButton.onclick = reviewAppointment;

  var editButton = document.getElementById('edit-appointment');
  editButton.onclick = editAppointment;

  // Form submit handler
  $('#appointment-form').submit(function() {
    $('#submit-appointment').prop('disabled', true);
    $('#appointment-form #form-fields').hide();
    $('#appointment-form #form-review').show();

    var formData = $(this).serialize();
    $.ajax({
      type: 'POST',
      url: '/',
      data: formData,
      success: function() {
        $('#appointment-section').hide();
        $('#appointment-receipt').show();
        $('#appointment-form').addClass('successfully-submitted');
      },
      error: function(response) {
        $('#appointment-form input').removeClass('server-error');
        $('#package-radios').removeClass('server-error');

        // Display errors
        var fieldErrors = JSON.parse(response.responseText);
        for (var field in fieldErrors) {

          if (field === 'availability') {
            var radios = $('#package-radios')[0];
            radios.classList.add('server-error');
            radios.setAttribute('data-error', fieldErrors[field][0]);
          }

          var error = fieldErrors[field][0];
          if (field !== 'package') {
            var input = $(`input[name=${field}]`)[0];
            input.classList.add('server-error');
            var label = input.labels[0];

            label.setAttribute('data-error', error.message);
          }
          else {
            var radios = $('#package-radios')[0];
            radios.classList.add('server-error');
            radios.setAttribute('data-error', 'Select a package and date.');
          }
        }

        // Go back to editing appointment
        $('#appointment-form').addClass('submitted');
        editAppointment();
        $('#submit-appointment').prop('disabled', false);
      }
    });

    return false;
  });

  // Package selection handler
  $('input[name=package]').change(function() {
    var package_id = null;
    var packageRadios = $('input[name=package]');
    for (var package of packageRadios) {
      if (package.checked) {
        package_id = package.value;
      }
    }

    $.ajax({
      type: 'POST',
      url: '/availability_check/',
      data: {package_id},
      error: function(response) {
        // console.log(response);
      }
    });

    $(`#package-details${package_id}`).animate(
      {'maxHeight': 500}, {duration: 300, queue: false}
    );

    $('.package-details').not(`#package-details${package_id}`).animate(
      {'maxHeight': 0}, {duration: 300, queue: false}
    );
  });

  // Create event listener for inputs
  $('input[name=months]').change(function(e) {
    var package_id = null;
    var packageRadios = $('input[name=package]');
    for (var package of packageRadios) {
      if (package.checked) {
        package_id = package.value;
      }
    }

    // Unselect all
    $('.month-label').removeClass('selected');

    // First, hide all showing dates
    $('.dates').hide();

    // Show the one which was just checked
    var month = this.value;
    $(`#${month}-dates${package_id}`).show();
    $(this).closest('label').addClass('selected');
  });

  $('input[name=availability]').change(function() {
    $('.date-label').removeClass('selected');
    $(this).closest('label').addClass('selected');
  });

  $('input[name=package]').first().attr('checked', true);
  $('input[name=package]').first().change();
  $('input[name=months]').first().attr('checked', true);
  $('input[name=months]').first().change();
  $('input[name=availability]').first().attr('checked', true);
  $('input[name=availability]').first().change();

  // Keep track of when field was clicked
  $('.field-group').focusin(function() {
    $(this).addClass('clicked');
    $(this).removeClass('unclicked');
  });

  // Keep track of when field was blurred
  $('.field-group').focusout(function() {
    if($(this).find('input').val() !== '') {
      $(this).addClass('unclicked');
    }
  });

  // Because autofill
  setInterval(function () {
    for (var fieldGroup of $('.field-group')) {
      if($(fieldGroup).find('input').val() !== '') {
        fieldGroup.classList.add('unclicked');
      }
    }
  }, 50);

  function reviewAppointment(event) {
    // Change header
    var creationHeader = document.getElementById('creation-header');
    var reviewHeader = document.getElementById('review-header');
    var editHeader = document.getElementById('edit-header');
    var creationParagraph = document.getElementById('creation-paragraph');
    var reviewParagraph = document.getElementById('review-paragraph');
    var editParagraph = document.getElementById('edit-paragraph');

    creationHeader.classList.add('hidden');
    creationParagraph.classList.add('hidden');
    reviewHeader.classList.remove('hidden');
    reviewParagraph.classList.remove('hidden');
    editHeader.classList.add('hidden');
    editParagraph.classList.add('hidden');

    // Change buttons
    var reviewButton = document.getElementById('review-appointment');
    var editButton = document.getElementById('edit-appointment');
    var submitButton = document.getElementById('submit-appointment');
    reviewButton.classList.add('hidden');
    editButton.classList.remove('hidden');
    submitButton.classList.remove('hidden');

    // Create review
    var container = $('#form-review');
    container.empty();
    var inputs = $('#appointment-form input');
    var ignoreFields = ['csrfmiddlewaretoken', 'package', 'availability', 'psuedo-availability', 'months'];
    for (var input of inputs) {
      if (ignoreFields.indexOf(input.name) === -1) {
        var label = input.labels[0];
        var name = label.innerText;
        var value = input.value || 'Empty';
        var reviewLine = $(`<p><b>${name}</b>: <span>${value}</span></p>`);
        container.append(reviewLine);
      }
    }

    var packageRadios = $('input[name=package]')
    var packageName = 'Empty';
    for (var radio of packageRadios) {
      if (radio.checked) {
        packageName = $(radio).data('name');
      }
    }

    var reviewLine = $(`<p><b>Package</b>: <span>${packageName}</span></p>`);
    container.append(reviewLine);

    var availabilities = $('input[name=availability]')
    var dateString = 'Empty';
    for (var availability of availabilities) {
      if (availability.checked) {
        dateString = $(availability).data('date');
      }
    }

    var reviewLine = $(`<p><b>Date</b>: <span>${dateString}</span></p>`);
    container.append(reviewLine);

    $('#appointment-form #form-fields').hide();
    $('#appointment-form #form-review').show();
    $('#appointment-form').attr('novalidate', true);
    $('.section').hide();
    $('#appointment-section').scrollTop(0);
    $('#appointment-section').show();
  }

  function editAppointment() {

    // Change header
    var reviewHeader = document.getElementById('review-header');
    var reviewParagraph = document.getElementById('review-paragraph');
    var editHeader = document.getElementById('edit-header');
    var editParagraph = document.getElementById('edit-paragraph');
    reviewHeader.classList.add('hidden');
    reviewParagraph.classList.add('hidden');
    editHeader.classList.remove('hidden');
    editParagraph.classList.remove('hidden');

    // Change buttons
    var reviewButton = document.getElementById('review-appointment');
    var editButton = document.getElementById('edit-appointment');
    var submitButton = document.getElementById('submit-appointment');
    reviewButton.classList.remove('hidden');
    editButton.classList.add('hidden');
    submitButton.classList.add('hidden');

    $('#appointment-form #form-review').hide();
    $('#appointment-form #form-fields').show();
    $('#appointment-form').attr('novalidate', false);
    $('.section').hide();
    $('#appointment-section').scrollTop(0);
    $('#appointment-section').show();
  }
});
