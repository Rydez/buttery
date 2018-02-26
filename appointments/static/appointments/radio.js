$(document).ready(function() {

  var checkAnimations = {};
  var uncheckAnimations = {};
  var packageRadios = $('#package-radios').find('svg');
  for (var radio of packageRadios) {
    checkAnimations[radio.id] = new TimelineMax({paused:true});
    uncheckAnimations[radio.id] = new TimelineMax({paused:true});

    checkAnimations[radio.id]
      .set(`svg#${radio.id} .ring`, {opacity:1})
      .set(`svg#${radio.id} .drops`, {opacity:0})
      .set(`svg#${radio.id} .ring0`, {opacity:0})
      .set(`svg#${radio.id} .drop`, {opacity:0, y:-32, scale:.4, x:0, transformOrigin:"50%, 0%"})
      .set(`svg#${radio.id} .ring`, {transformOrigin:"50%, 50%"})
      .set(`svg#${radio.id} .dropTop`, {opacity:1,scale:.2, transformOrigin:"50%, 0%"})
      .add('sync')
      .to(`svg#${radio.id} .ring`, .17, { scaleY:.95}, 'sync')
      .to(`svg#${radio.id} .dropTop`, .1, { scale:1, y:.5, ease:Power0.easeNone}, 'sync')
      .to(`svg#${radio.id} .dropTop`, .1, { scale:.3, ease:Power0.easeNone}, 'sync +=.08')
      .to(`svg#${radio.id} .dropTop`, .08, {transformOrigin:"50%, 40%", scale:0, ease:Power0.easeNone}, 'sync +=.181')
      .set(`svg#${radio.id} .drop`,  { opacity:1, ease:Power0.easeNone}, 'sync')
      .to(`svg#${radio.id} .drop`, .17, { y:0, ease:Power1.easeIn}, 'sync')
      .to(`svg#${radio.id} .drop`, .08, {scale:.9, ease:Power0.easeNone}, 'sync +=.02')
      .to(`svg#${radio.id} .ring`, 2, {transformOrigin:"50%, 50%", scaleY:1, ease:Elastic.easeOut.config(.8, .1)}, 'sync +=.14')
      .to(`svg#${radio.id} .drop`, 1.8, {transformOrigin:"50%, 10%", scale:1, ease:Elastic.easeOut.config(.8, .14)}, 'sync +=.14')


    uncheckAnimations[radio.id]
      .set(`svg#${radio.id} .ring0`, {opacity:1})
      .set(`svg#${radio.id} .drop`, {opacity:0})
      .set(`svg#${radio.id} .ring`, {opacity:0})
      .set(`svg#${radio.id} .drops`, {opacity:1})
      .set(`svg#${radio.id} .drop0`, {rotation:'40deg',transformOrigin:"50%, 50%"})
      .set(`svg#${radio.id} .drop1`, {rotation:'112deg',transformOrigin:"50%, 50%"})
      .set(`svg#${radio.id} .drop2`, {rotation:'175deg',transformOrigin:"50%, 50%"})
      .set(`svg#${radio.id} .drop3`, {rotation:'-110deg',transformOrigin:"50%, 50%"})
      .set(`svg#${radio.id} .drop4`, {rotation:'-35deg',transformOrigin:"50%, 50%"})
      .add('uncheck')
      .to(`svg#${radio.id} .drops`, .2, {transformOrigin:"50%, 50%", scaleX:.5, scaleY:.3,})
      .staggerTo(`svg#${radio.id} .drops`, .2, { cycle:{
        x:[45, 59, 14, -62, -35],
        y:[-46, 29, 62, 15, -55],
      }}, '0.0184', 'uncheck+=.1')
      .to(`svg#${radio.id} .ring0`, .2, {transformOrigin:"50%, 50%", scale:1.05}, 'uncheck+=.1')
      .add('last')
      .to(`svg#${radio.id} .ring0`, 2, {transformOrigin:"50%, 50%", scale:1, ease:Elastic.easeOut.config(.8, .1)}, 'last')
      .to(`svg#${radio.id} .drops`, .2, {scaleY:.1, scaleX:.3},'last+=0');

    checkAnimations[radio.id].timeScale(1.27);
    uncheckAnimations[radio.id].timeScale(1.14);

    $('.toggler').click(function() {
      var [toggler] = $(this);
      var clickedPackageId = toggler.id.split('toggler')[1];

      // Check if we're clicking one that's not checked
      if (!$(`#radio${clickedPackageId}`).is(':checked')) {

        // Uncheck the checked one
        var packageRadios = $('.package-radio');
        for (var radio of packageRadios) {
          if (radio.checked) {
            var uncheckPackageId = radio.id.split('radio')[1];
            $(`#short-description${uncheckPackageId}`).hide();
            uncheckAnimations[uncheckPackageId].play(0);
          }
        }

        // Check the clicked one
        checkAnimations[clickedPackageId].play(0);
        $(`#radio${clickedPackageId}`).prop('checked', true);
        $(`#short-description${clickedPackageId}`).show();
        $(`#radio${clickedPackageId}`).change();
      }
    });
  }
});