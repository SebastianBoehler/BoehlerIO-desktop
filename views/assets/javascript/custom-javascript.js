

/* -------------------- Navbar Setting -------------------- */

// Navbar Scroll

$(window).scroll(function () {
    $(".navbar").toggleClass("scroll", $(this).scrollTop() > 1)
    $("#scroll-top").toggleClass("scroll", $(this).scrollTop() > 1)
});

/* -------------------- Sidebar Setting -------------------- */

// Sidebar Toggle

$(".nav-toggle").click(function () {
    $("body").toggleClass("sidebar-on-open");
    $(".sidebar-primary").toggleClass("sidebar-open");
    $(".sidebar-overlay").toggleClass("active");
});

// Overlay Toggle

$(".sidebar-overlay").click(function () {
    $("body").removeClass("sidebar-on-open");
    $(".sidebar-primary").removeClass("sidebar-open");
    $(".sidebar-overlay").removeClass("active");
});

/* -------------------- Slick Setting -------------------- */

// Single Slick

$('.slick-responsive-auto.single').slick({
    lazyLoad: 'ondemand',
    mobileFirst: false,
    dots: true,
    arrows: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    infinite: false,
    autoplay: false,
    autoplaySpeed: 3500,
});

/* -------------------- Clock Setting -------------------- */

// Date and Time

function startTime() {
    var today = new Date();
    var hr = today.getHours();
    var min = today.getMinutes();
    var sec = today.getSeconds();
    ap = (hr < 12) ? "<span>AM</span>" : "<span>PM</span>";
    hr = (hr == 0) ? 12 : hr;
    hr = (hr > 12) ? hr - 12 : hr;

    hr = checkTime(hr);
    min = checkTime(min);
    sec = checkTime(sec);
    document.getElementById("clock").innerHTML = hr + ":" + min + ":" + sec + " " + ap;

    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var curWeekDay = days[today.getDay()];;
    var date = curWeekDay;
    document.getElementById("date").innerHTML = date;

    var time = setTimeout(function () { startTime() }, 500);
}
function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}