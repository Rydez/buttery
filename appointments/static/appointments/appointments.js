$(document).ready(function() {

  // Uses document because document will be topmost level in bubbling
  $(document).on('touchmove',function(e){
    e.preventDefault();
  });

  // Uses body because jQuery on events are called off of the element they are
  // added to, so bubbling would not work if we used document instead.
  $('body').on('touchstart', '#body', function(e) {
    if (e.currentTarget.scrollTop === 0) {
      e.currentTarget.scrollTop = 1;
    } else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
      e.currentTarget.scrollTop -= 1;
    }
  });

  // Stops preventDefault from being called on document if it sees a scrollable div
  $('body').on('touchmove', '#body', function(e) {
    e.stopPropagation();
  });

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
      $('#home-section').scrollTop(0);
      $('#home-section').show();
    }
    else if (clickedEl.id === 'packages-button') {
      $('#packages-section').scrollTop(0);
      $('#packages-section').show();
    }
    else if (clickedEl.id === 'appointments-button') {
      $('#appointment-section').scrollTop(0);
      $('#appointment-section').show();
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
      $('#appointment-section').scrollTop(0);
      $('#appointment-section').show();
      $('#appointments-button').addClass('selected');
    }

    closeHamburgerMenu();
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

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Package selection handler
  $('input[name=package]').change(function() {

    $('.availability').empty();

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
        var [container] = $(`#availability${package_id}`);
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

          // Unselect all
          $('.month-label').removeClass('selected');

          // First, hide all showing dates
          $('.dates').hide();
          var month = this.value;
          if (this.checked) {

            // Show the one which was just checked
            $(`#${month}-dates`).show();
            $(this).closest('label').addClass('selected');
          }
        });

        $('input[name=availability]').change(function() {

          // Unselect all
          $('.date-label').removeClass('selected');

          if (this.checked) {
            $(this).closest('label').addClass('selected');
          }
        });

        $('input[name=months]').first().attr('checked', true);
        $('input[name=months]').first().closest('label').addClass('selected');
        $('input[name=months]').first().change();

        $('input[name=availability]').first().attr('checked', true);
        $('input[name=availability]').first().closest('label').addClass('selected');
        $('input[name=availability]').first().change();
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
    $('#hamburger').addClass('opened');
    $('#hamburger-menu').addClass('opened');
    $('#hamburger-close').addClass('opened');
    $('#hamburger-close').removeClass('no-click');
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

  $(document).click(function(e) {
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
  $('#hamburger-close, #hamburger').on("mousedown mouseup touchstart touchend", function() {
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
    $('#hamburger-menu').removeClass('opened');
    $('#hamburger').removeClass('opened');
    $('#content').removeClass('background-blur');
    $('#foreground-car').removeClass('background-blur');
  }

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