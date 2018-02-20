$(document).ready(function() {

  // Cookie handling stuff
  function get_cookie(name) {
    var cookie_value = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var cookie of cookies) {
        cookie = jQuery.trim(cookie);

        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookie_value = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookie_value;
  }

  var csrftoken = get_cookie('csrftoken');

  function csrfSafeMethod(method) {

    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    }
  });

  $('.navigation-button').click(function() {
    $('.navigation-button').removeClass('selected');
    var clickedButton = $(this);
    clickedButton.addClass('selected');

    $('.section').hide();
    var [clickedEl] = clickedButton;
    if (clickedEl.id === 'home-button') {
      $('#home-section').show();
    }
    else if (clickedEl.id === 'packages-button') {
      $('#packages-section').show();
    }
    else if (clickedEl.id === 'appointments-button') {
      $('#appointment-section').show();
    }

    return false;
  });

  var reviewButton = document.getElementById('review-appointment');
  reviewButton.onclick = reviewAppointment;

  var editButton = document.getElementById('edit-appointment');
  editButton.onclick = editAppointment;

  var homeButton = document.getElementById('back-to-home');
  homeButton.onclick = backToHome;

  // Form submit handler
  $('#appointment-form').submit(function() {

    // Remove disabled attribute in order to collect data, then re-disable them
    var disabled = $(this).find(':input:disabled').removeAttr('disabled');
    var formData = $(this).serialize();
    disabled.attr('disabled','true');

    $.ajax({
      type: 'POST',
      url: '/',
      data: formData,
      success: function() {
        $('#appointment-section').hide();
        $('#appointment-receipt').show();
      },
      error: function(response) {

        // Display errors
        var fieldErrors = JSON.parse(response.responseText);
        var ul = document.getElementById('form-errors');
        ul.innerHTML = '';
        for (var field in fieldErrors) {
          var [text] = fieldErrors[field];
          var li = document.createElement('li');
          li.appendChild(document.createTextNode(text.message));
          ul.appendChild(li);
        }

        // Go back to editing appointment
        editAppointment();
      }
    });

    return false;
  });

  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Package selection handler
  $('input[name=package]').change(function() {

    $('#availability').empty();

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
        console.log(response);
      }
    });

    $.ajax({
      type: 'GET',
      url: '/package_availabilities/',
      data: {package_id},
      success: function(availabilities) {
        // Get availability contianer
        var [container] = $('#availability');
        var [months] = $('<div/>', {id: 'months'});

        container.appendChild(months);

        // Keep track of month
        var currentMonth = '';
        var dates = null;
        for (var availability of JSON.parse(availabilities)) {
          var dateString = availability.fields.date;
          var date = new Date(dateString);
          var nextMonth = monthNames[date.getMonth()];

          // When there's a new month, make an input for it
          if (nextMonth !== currentMonth) {
            currentMonth = nextMonth;

            // Create container for dates of each month
            [dates] = $('<div/>', {
              id: `${nextMonth}-dates`,
              class: 'dates'
            });

            container.appendChild(dates);
            $(`#${nextMonth}-dates`).hide();

            // Create label for input
            var [monthLabel] = $(`<label>${nextMonth}</label>`)

            // Create month input and put it in months div
            var [monthInput] = $('<input/>', {
              type: 'radio',
              value: nextMonth,
              id: `${nextMonth}-input`,
              name: 'months'
            });

            monthLabel.appendChild(monthInput)
            months.appendChild(monthLabel);
          }

          // Create label for input
          var [dateLabel] = $(`<label>${days[date.getDay()]}, ${date.getDate()}</label>`)

          // Always append the date
          var [dateInput] = $('<input/>', {
            type: 'radio',
            value: availability.pk,
            name: 'availability'
          });

          dateLabel.appendChild(dateInput)
          dates.appendChild(dateLabel);
        }

        // Create event listener for inputs
        $('input[name=months]').change(function() {

          // First, hide all showing dates
          $('.dates').hide();
          var month = this.value;
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

  // Open hamburger menu
  $('#hamburger').click(function() {
    $(this).addClass('opened');
    $('#hamburger-menu').addClass('opened');
    $('#hamburger-close').addClass('opened');
    $('#hamburger-close').removeClass('no-click');
    $('#content').addClass('background-blur');
    $('#foreground-car').addClass('background-blur');
    $('.hamburger-divider').animate({opacity: 1}, 2500);
    $('.slice-icon').animate({opacity: 1}, 2500);
  });

  $('#hamburger-close').click(function() {
    $('.hamburger-divider').stop().animate({opacity: 0}, 50);
    $('.slice-icon').stop().animate({opacity: 0}, 50);
    $(this).removeClass('opened');
    $('#hamburger-close').addClass('no-click');
    $('#hamburger-menu').removeClass('opened');
    $('#hamburger').removeClass('opened');
    $('#content').removeClass('background-blur');
    $('#foreground-car').removeClass('background-blur');
  });

  // border on active hamburger icon
  $('#hamburger-close, #hamburger').on("mousedown mouseup", function() {
    console.log('111111111')
    $('.patty').toggleClass('hamburger-icon-active');
    $('#back').toggleClass('hamburger-icon-active');
    $('#forward').toggleClass('hamburger-icon-active');
  });


  function reviewAppointment(event) {

    // Remove packages
    var packages = document.getElementById('packages');
    packages.classList.add('hidden');

    // Change header
    var creationHeader = document.getElementById('creation-header');
    var reviewHeader = document.getElementById('review-header');
    var editHeader = document.getElementById('edit-header');
    creationHeader.classList.add('hidden');
    reviewHeader.classList.remove('hidden');
    editHeader.classList.add('hidden');

    // Change buttons
    var reviewButton = document.getElementById('review-appointment');
    var editButton = document.getElementById('edit-appointment');
    var submitButton = document.getElementById('submit-appointment');
    reviewButton.classList.add('hidden');
    editButton.classList.remove('hidden');
    submitButton.classList.remove('hidden');

    // Disable fields
    var fields = document.getElementById('appointment-form').elements;
    for (var field of fields) {
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
    var reviewHeader = document.getElementById('review-header');
    var editHeader = document.getElementById('edit-header');
    reviewHeader.classList.add('hidden');
    editHeader.classList.remove('hidden');

    // Change buttons
    var reviewButton = document.getElementById('review-appointment');
    var editButton = document.getElementById('edit-appointment');
    var submitButton = document.getElementById('submit-appointment');
    reviewButton.classList.remove('hidden');
    editButton.classList.add('hidden');
    submitButton.classList.add('hidden');

    // Disable fields
    var fields = document.getElementById('appointment-form').elements;
    for (var field of fields) {
      field.disabled = false;
    }
  }

  function backToHome(event) {
    window.location = '';
  }

});
