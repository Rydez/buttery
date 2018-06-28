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





  // Select the nav button
  var slug = window.location.pathname.split('/')[1];
  if (slug === '') {
    $('#home-button').addClass('selected');
  }
  else if (slug === 'packages') {
    $('#packages-button').addClass('selected');
  }
  else if (slug === 'dealerships') {
    $('#dealerships-button').addClass('selected');
  }

  // else if (slug === 'appointments') {
  //   $('#appointments-button').addClass('selected');
  // }

  // Open hamburger menu
  $('#hamburger').click(function() {
    $('#hamburger').addClass('opened');
    $('#hamburger-menu').addClass('opened');
    $('#hamburger-close').addClass('opened');
    $('#hamburger-close').removeClass('no-click');
    $('.hamburger-social-link').removeClass('no-click');
    $('#content').addClass('background-blur');
    $('#foreground-car').addClass('background-blur');

    // Select the nav button
    var slug = window.location.pathname.split('/')[1];
    if (slug === '') {
      $('#home-slice').find('p').addClass('slice-icon-text-active');
      $('#home-slice').find('svg').addClass('slice-icon-svg-active');
    }
    else if (slug === 'packages') {
      $('#packages-slice').find('p').addClass('slice-icon-text-active');
      $('#packages-slice').find('svg').addClass('slice-icon-svg-active');
    }
    else if (slug === 'dealerships') {
      $('#dealerships-slice').find('p').addClass('slice-icon-text-active');
      $('#dealerships-slice').find('svg').addClass('slice-icon-svg-active');
    }
    // else if (slug === 'appointments') {
    //   $('#appointments-slice').find('p').addClass('slice-icon-text-active');
    //   $('#appointments-slice').find('svg').addClass('slice-icon-svg-active');
    // }

    $('.hamburger-divider').stop(true, true).delay(200).animate({opacity: 1}, 500);
    $('.slice-icon').stop(true, true).delay(200).animate({opacity: 1}, 500);
    $('.social-media-icon').stop(true, true).delay(200).animate({opacity: 1}, 500);
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

  $('#hamburger-close, #hamburger').on('mousedown mouseup touchstart touchend', function() {
    $('.patty').toggleClass('hamburger-icon-active');
    $('#back').toggleClass('hamburger-icon-active');
    $('#forward').toggleClass('hamburger-icon-active');
  });

  // active hamburger icon
  $('.slice-icon').on('mousedown mouseup touchstart touchend', function() {
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
});