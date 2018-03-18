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

  $.ajax({
    type: 'POST',
    url: '/visit/',
    data: {},
    error: function(response) {
      console.log(response);
    }
  });

  $('#logo-image').click(function() {
    $('.navigation-button').removeClass('selected');
    $('#home-button').addClass('selected');
    $('#home-section').scrollTop(0);
    $('#home-section').show();
  });

  $('.navigation-button').click(function() {
    $('.navigation-button').removeClass('selected');
    var clickedButton = $(this);
    clickedButton.addClass('selected');

    $('.section').hide();
    var [clickedEl] = clickedButton;
    if (clickedEl.id === 'home-button') {
      $('#home-section').scrollTop(0);
      $('#home-section').show();
    }
    else if (clickedEl.id === 'packages-button') {
      $('#packages-section').scrollTop(0);
      $('#packages-section').show();
    }
    else if (clickedEl.id === 'appointments-button') {
      if ($('#appointment-form').hasClass('successfully-submitted')) {
        $('#appointment-receipt').scrollTop(0);
        $('#appointment-receipt').show();
      }
      else {
        $('#appointment-section').scrollTop(0);
        $('#appointment-section').show();
      }
    }

    return false;
  });

  $('.slice-icon').click(function() {
    $('.section').hide();
    var [clickedEl] = $(this);
    $('.navigation-button').removeClass('selected');
    if (clickedEl.id === 'home-slice') {
      $('#home-section').scrollTop(0);
      $('#home-section').show();
      $('#home-button').addClass('selected');
    }
    else if (clickedEl.id === 'services-slice') {
      $('#packages-section').scrollTop(0);
      $('#packages-section').show();
      $('#packages-button').addClass('selected');
    }
    else if (clickedEl.id === 'schedule-slice') {
      if ($('#appointment-form').hasClass('successfully-submitted')) {
        $('#appointment-receipt').scrollTop(0);
        $('#appointment-receipt').show();
        $('#appointments-button').addClass('selected');
      }
      else {
        $('#appointment-section').scrollTop(0);
        $('#appointment-section').show();
        $('#appointments-button').addClass('selected');
      }
    }

    closeHamburgerMenu();
  });

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

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Package selection handler
  $('input[name=package]').change(function() {

    $('.availability').empty();
    $('.package-details').removeClass('opened');
    $('.short-description').hide();

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

    $.ajax({
      type: 'GET',
      url: '/package_availabilities/',
      data: {package_id},
      success: function(availabilities) {
        // Get availability contianer

        $(`#short-description${package_id}`).show();
        var [container] = $(`#availability${package_id}`);

        var availabilities = JSON.parse(availabilities);
        if (availabilities.length === 0) {
          var [months] = $('<div/>', {
            id: 'months',
            class: 'no-availabilities'
          });

          var [noAvailabilities] = $(`<span>All availabilities taken.</span>`);
          months.appendChild(noAvailabilities);
          container.appendChild(months);
          $(`#package-details${package_id}`).addClass('opened');
          return;
        }

        var [months] = $('<div/>', {id: 'months'});
        container.appendChild(months);

        // Keep track of month
        var currentMonth = '';
        var dates = null;
        for (var availability of availabilities) {
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
            var [monthLabel] = $(`<label>${nextMonth}</label>`);
            monthLabel.classList.add('month-label');

            // Create month input and put it in months div
            var [monthInput] = $('<input/>', {
              type: 'radio',
              value: nextMonth,
              id: `${nextMonth}-input`,
              name: 'months'
            });

            monthLabel.appendChild(monthInput);
            months.appendChild(monthLabel);
          }

          // Create label for input
          var [dateLabel] = $(`<label>${days[date.getDay()]}, ${date.getDate()}</label>`);
          dateLabel.classList.add('date-label');
          dateLabel.setAttribute('for', `availability-date${availability.pk}`)

          // Always append the date
          var [dateInput] = $('<input/>', {
            id: `availability-date${availability.pk}`,
            type: 'radio',
            value: availability.pk,
            name: 'availability',
            'data-date': `${days[date.getDay()]}, ${nextMonth} ${date.getDate()}`
          });

          dateLabel.appendChild(dateInput);
          dates.appendChild(dateLabel);
        }

        // Create event listener for inputs
        $('input[name=months]').change(function() {

          // Unselect all
          $('.month-label').removeClass('selected');

          // First, hide all showing dates
          $('.dates').hide();
          var month = this.value;

          // Show the one which was just checked
          $(`#${month}-dates`).show();
          $(this).closest('label').addClass('selected');
        });

        $('input[name=availability]').change(function() {
          $('.date-label').removeClass('selected');
          $(this).closest('label').addClass('selected');
        });

        $('input[name=months]').first().attr('checked', true);
        $('input[name=months]').first().closest('label').addClass('selected');
        $('input[name=months]').first().change();

        $('.availability input[name=availability]').first().attr('checked', true);
        $('.availability input[name=availability]').first().closest('label').addClass('selected');
        $('.availability input[name=availability]').first().change();

        $(`#package-details${package_id}`).addClass('opened');
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

  // Because autofill
  setInterval(function () {
    for (var fieldGroup of $('.field-group')) {
      if($(fieldGroup).find('input').val() !== '') {
        fieldGroup.classList.add('unclicked');
      }
    }
  }, 50);

  // Open hamburger menu
  $('#hamburger').click(function() {
    $('#hamburger').addClass('opened');
    $('#hamburger-menu').addClass('opened');
    $('#hamburger-close').addClass('opened');
    $('#hamburger-close').removeClass('no-click');
    $('.hamburger-social-link').removeClass('no-click');
    $('#content').addClass('background-blur');
    $('#foreground-car').addClass('background-blur');
    $('.hamburger-divider').animate({opacity: 1}, 1500);
    $('.slice-icon').animate({opacity: 1}, 1500);
    $('.social-media-icon').animate({opacity: 1}, 1500);
    $('.slice-icon').css('pointer-events', 'auto');
  });

  $('#hamburger-close').click(function() {
    closeHamburgerMenu();
  });

  $(document).on('mousedown mouseup touchstart touchend', function(e) {
    const hamburger = $(e.target).closest('#hamburger')[0];
    if (hamburger) {
      return;
    }

    const hamburgerComponents = $(e.target).closest('#hamburger-components')[0];
    if (!hamburgerComponents) {
      closeHamburgerMenu();
    }
  });

  // border on active hamburger icon
  $('#hamburger-close, #hamburger').on('mousedown mouseup touchstart touchend', function() {
    $('.patty').toggleClass('hamburger-icon-active');
    $('#back').toggleClass('hamburger-icon-active');
    $('#forward').toggleClass('hamburger-icon-active');
  });

  // border on active hamburger icon
  $('.slice-icon').on("mousedown mouseup touchstart touchend", function() {
    $(this).find('p').toggleClass('slice-icon-text-active');
    $(this).find('svg').toggleClass('slice-icon-svg-active');
  });

  function closeHamburgerMenu() {
    $('.hamburger-divider').stop().animate({opacity: 0}, 50);
    $('.slice-icon').stop().animate({opacity: 0}, 50);
    $('.social-media-icon').stop().animate({opacity: 0}, 50);
    $('.slice-icon').css('pointer-events', 'none');
    $('#hamburger-close').removeClass('opened');
    $('#hamburger-close').addClass('no-click');
    $('.hamburger-social-link').addClass('no-click');
    $('#hamburger-menu').removeClass('opened');
    $('#hamburger').removeClass('opened');
    $('#content').removeClass('background-blur');
    $('#foreground-car').removeClass('background-blur');
  }

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

  function backToHome(event) {
    window.location = '';
  }
});
