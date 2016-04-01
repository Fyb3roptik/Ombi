﻿Handlebars.registerHelper('if_eq', function (a, b, opts) {
    if (a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

var searchSource = $("#search-template").html();
var musicSource = $("#music-template").html();
var searchTemplate = Handlebars.compile(searchSource);
var musicTemplate = Handlebars.compile(musicSource);
var noResultsHtml = "<div class='no-search-results'>" +
    "<i class='fa fa-film no-search-results-icon'></i><div class='no-search-results-text'>Sorry, we didn't find any results!</div></div>";
var noResultsMusic = "<div class='no-search-results'>" +
    "<i class='fa fa-headphones no-search-results-icon'></i><div class='no-search-results-text'>Sorry, we didn't find any results!</div></div>";
var searchTimer = 0;

// Type in movie search
$("#movieSearchContent").on("input", function () {
    if (searchTimer) {
        clearTimeout(searchTimer);
    }
    $('#movieSearchButton').attr("class","fa fa-spinner fa-spin");
    searchTimer = setTimeout(movieSearch, 400);

});

$('#moviesComingSoon').on('click', function (e) {
    e.preventDefault();
    moviesComingSoon();
});

$('#moviesInTheaters').on('click', function (e) {
    e.preventDefault();
    moviesInTheaters();
});

// Type in TV search
$("#tvSearchContent").on("input", function () {
    if (searchTimer) {
        clearTimeout(searchTimer);
    }
    $('#tvSearchButton').attr("class", "fa fa-spinner fa-spin");
    searchTimer = setTimeout(tvSearch, 400);
});

// Click TV dropdown option
$(document).on("click", ".dropdownTv", function (e) {
    e.preventDefault();
    var buttonId = e.target.id;
    if ($("#" + buttonId).attr('disabled')) {
        return;
    }

    $("#" + buttonId).prop("disabled", true);
    loadingButton(buttonId, "primary");


    var $form = $('#form' + buttonId);
    var data = $form.serialize();
    var seasons = $(this).attr("season-select");
    if (seasons === "2") {
        // Send over the latest
        data = data + "&seasons=latest";
    }
    if (seasons === "1") {
        // Send over the first season
        data = data + "&seasons=first";

    }

    var type = $form.prop('method');
    var url = $form.prop('action');

    sendRequestAjax(data, type, url, buttonId);
});

// Search Music
$("#musicSearchContent").on("input", function () {
    if (searchTimer) {
        clearTimeout(searchTimer);
    }
    $('#musicSearchButton').attr("class", "fa fa-spinner fa-spin");
    searchTimer = setTimeout(musicSearch, 400);

});

// Click Request for movie
$(document).on("click", ".requestMovie", function (e) {
    e.preventDefault();
    var buttonId = e.target.id;
    if ($("#" + buttonId).attr('disabled')) {
        return;
    }

    $("#" + buttonId).prop("disabled", true);
    loadingButton(buttonId, "primary");


    var $form = $('#form' + buttonId);

    var type = $form.prop('method');
    var url = $form.prop('action');
    var data = $form.serialize();

    sendRequestAjax(data, type, url, buttonId);
    
});

// Click Request for album
$(document).on("click", ".requestAlbum", function (e) {
    e.preventDefault();
    var buttonId = e.target.id;
    if ($("#" + buttonId).attr('disabled')) {
        return;
    }

    $("#" + buttonId).prop("disabled", true);
    loadingButton(buttonId, "primary");


    var $form = $('#form' + buttonId);

    var type = $form.prop('method');
    var url = $form.prop('action');
    var data = $form.serialize();

    sendRequestAjax(data, type, url, buttonId);

});

function sendRequestAjax(data, type, url, buttonId) {
    $.ajax({
        type: type,
        url: url,
        data: data,
        dataType: "json",
        success: function (response) {
            console.log(response);
            if (response.result === true) {
                generateNotify(response.message || "Success!", "success");

                $('#' + buttonId).html("<i class='fa fa-check'></i> Requested");
                $('#' + buttonId).removeClass("btn-primary-outline");
                $('#' + buttonId).removeAttr("data-toggle");
                $('#' + buttonId).addClass("btn-success-outline");
            } else {
                generateNotify(response.message, "warning");
                $('#' + buttonId).html("<i class='fa fa-plus'></i> Request");
                $('#' + buttonId).attr("data-toggle", "dropdown");
                $("#" + buttonId).removeAttr("disabled");
            }
        },
        error: function (e) {
            console.log(e);
            generateNotify("Something went wrong!", "danger");
        }
    });
}

function movieSearch() {
    var query = $("#movieSearchContent").val();
    getMovies("/search/movie/" + query);
}

function moviesComingSoon() {
    getMovies("/search/movie/upcoming");
}

function moviesInTheaters() {
    getMovies("/search/movie/playing");
}

function getMovies(url) {
    $("#movieList").html("");
    

    $.ajax(url).success(function (results) {
        if (results.length > 0) {
            results.forEach(function(result) {
                var context = buildMovieContext(result);

                var html = searchTemplate(context);
                $("#movieList").append(html);
            });
        }
        else {
            $("#movieList").html(noResultsHtml);
        }
        $('#movieSearchButton').attr("class","fa fa-search");
    });
};

function tvSearch() {
    var query = $("#tvSearchContent").val();
    getTvShows("/search/tv/" + query);
}

function getTvShows(url) {
    $("#tvList").html("");

    $.ajax(url).success(function (results) {
        if (results.length > 0) {
            results.forEach(function(result) {
                var context = buildTvShowContext(result);
                var html = searchTemplate(context);
                $("#tvList").append(html);
            });
        }
        else {
            $("#tvList").html(noResultsHtml);
        }
        $('#tvSearchButton').attr("class", "fa fa-search");
    });
};

function musicSearch() {
    var query = $("#musicSearchContent").val();
    getMusic("/search/music/" + query);
}

function getMusic(url) {
    $("#musicList").html("");
    
    $.ajax(url).success(function (results) {
        if (results.length > 0) {
            results.forEach(function (result) {
                var context = buildMusicContext(result);

                var html = musicTemplate(context);
                $("#musicList").append(html);
            });
        }
        else {
            $("#musicList").html(noResultsMusic);
        }
        $('#musicSearchButton').attr("class", "fa fa-search");
    });
};

function buildMovieContext(result) {
    var date = new Date(result.releaseDate);
    var year = date.getFullYear();
    var context = {
        posterPath: result.posterPath,
        id: result.id,
        title: result.title,
        overview: result.overview,
        voteCount: result.voteCount,
        voteAverage: result.voteAverage,
        year: year,
        type: "movie",
        imdb: result.imdbId
    };

    return context;
}

function buildTvShowContext(result) {
    var date = new Date(result.firstAired);
    var year = date.getFullYear();
    var context = {
        posterPath: result.banner,
        id: result.id,
        title: result.seriesName,
        overview: result.overview,
        year: year,
        type: "tv",
        imdb: result.imdbId
    };
    return context;
}

function buildMusicContext(result) {

    var context = {
        id: result.id,
        title: result.title,
        overview: result.overview,
        year: result.releaseDate,
        type: "album",
        trackCount: result.trackCount,
        coverArtUrl: result.coverArtUrl,
        artist: result.artist,
        releaseType: result.releaseType,
        country: result.country
    };

    return context;
}
