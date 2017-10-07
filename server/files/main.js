var ip = '192.168.178.21';
var port = '80';

var socket = io.connect(ip + ":" + port);
socket.on('newCode', function (code) {
    $('#code').text(code);
});
socket.on('confirmations', function (data) {
    if (data.closeModal)
        $('#confirmation-modal').modal('hide');
    $('.confirmation').remove();
    data.confirmations.forEach(function (confirmation) {
        $('#confirmations-container').append('<div id="' + confirmation.creator + '" class="confirmation"><img class="profile-icon" src="' + confirmation.icon.replace('.jpg', '_full.jpg') + '" /><div class="trade-info-short"><span class="title">' + confirmation.title + '</span><span class="info">' + confirmation.receiving + '</span><span class="info">' + confirmation.time + '</span><div></div>');
        if (confirmation.type == 2) {
            $('#' + confirmation.creator).click(function () {
                showConfirmation(confirmation.creator);
            });
        } else if (confirmation.type == 3) {
            $('#' + confirmation.creator).click(function () {
                selectConfirmation(confirmation.creator);
            });
        }
        $('#' + confirmation.creator).data('info', { key: confirmation.key, id: confirmation.id });
    });
});
socket.on('items', function (data) {
    $('#tradepartner').text('For ' + data.partner.name + '\'s items:');
    data.toGive.forEach(function (item) {
        $('#items-give').append('<div class="item"><img src="' + item.image + '" title="' + item.name + '" /></div>');
    });
    if (data.toReceive == "")
        $('#items-receive').append('<div class="item"><img title="Nothing" /></div>');
    else {
        data.toReceive.forEach(function (item) {
            $('#items-receive').append('<div class="item"><img src="' + item.image + '" title="' + item.name + '" /></div>');
        });
    }
    $('#title').text('Trade with ' + data.partner.name);
    $('#confirm-btn').click(function () {
        actOnTrade(data.creator, true);
    });
    $('#decline-btn').click(function () {
        actOnTrade(data.creator, false);
    });
});
socket.on('notify', function (data) {
    $.notify({
        message: data.message
    }, {
            type: data.type
    })
});
function copyCode() {
    $('#code').select();
    document.execCommand("copy")
}
function showConfirmation(creator) {
    $('#confirm-btn').unbind();
    $('#decline-btn').unbind();
    $('.modal-footer button').prop('disabled', false);
    $('.item').remove();
    $('#title').text('');
    socket.emit('confirmationDetails', creator);
    $('#confirmation-modal').modal();
}
function selectConfirmation(creator) {
    if ($('#' + creator).hasClass('selected'))
        $('#' + creator).removeClass('selected');
    else
        $('#' + creator).addClass('selected');
    $('.sell').prop('disabled', ($('.selected').length <= 0));
}
function sellItems(confirm) {
    var ids = [];
    var keys = [];
    $('.selected').each(function () {
        ids.push($(this).data('info').id);
        keys.push($(this).data('info').key);
        $(this).removeClass('selected').addClass('working-on');
    });
    $('.sell').prop('disabled', true);
    socket.emit('sell', { id: ids, key: keys, accept: confirm });
}
function actOnTrade(creator, accept) {
    $('.modal-footer button').prop('disabled', true);
    socket.emit('actOnTrade', { info: $('#' + creator).data('info'), accept: accept } );
}
$(document).ready(function () {
    var clipboard = new Clipboard('.btn');
    socket.emit('requestCode');
});