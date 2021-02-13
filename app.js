
$(function() {
    $('#address').change(function() {
        console.log('address changed');
    });

    $('#mask').change(function() {
        console.log('mask changed');
    });
});

function validIPv4(value) {
    return false;
}
