
let $addr;
let $mask;
let $wild;
let $cidr;
let $addrBin;
let $maskBin;
let $wildBin;

let $addrError;
let $maskError;
let $cidrError;
let $wildError;

let addrValid = true;
let maskValid = true;
let cidrValid = true;
let wildValid = true;

$(function() {
  $addr = $('#addr');
  $mask = $('#mask');
  $cidr = $('#cidr');
  $wild = $('#wild');
  $addrBin = $('#addrBin');
  $maskBin = $('#maskBin');
  $wildBin = $('#wildBin');

  $addrError = $('#addrError');
  $maskError = $('#maskError');
  $cidrError = $('#cidrError');
  $wildError = $('#wildError');

  $addr.keyup(function(e) {
    cleanAddr(e);
    if (addrValid) { updateBinVals(); }
    showHideErrors();
  });

  $mask.keyup(function(e) {
    cleanAddr(e);
    if (maskValid) { validateMask(); }
    if (maskValid) { updateCIDR(); updateWildFromMask(); updateBinVals(); }
    showHideErrors();
  });

  $cidr.keyup(function(e) {
    cleanCidr(e);
    if (cidrValid) { updateMaskFromCidr(); updateWildFromMask(); updateBinVals(); }
    showHideErrors();
  });

  $wild.keyup(function(e) {
    cleanAddr(e);
    if (wildValid) { validateWild(); }
    if (wildValid) { updateMaskFromWild(); updateCIDR(); updateBinVals(); }
    showHideErrors();
  });

  updateBinVals();
  showHideErrors();
});

function updateMaskFromWild() {
  let octs = $wild.val().split('.');

  for (let i = 0; i < octs.length; i++) {
    octs[i] = 255 - octs[i];
  }

  $mask.val(octs.join('.'));
}

function updateWildFromMask() {
  let octs = $mask.val().split('.');

  for (let i = 0; i < octs.length; i++) {
    octs[i] = 255 - octs[i];
  }

  $wild.val(octs.join('.'));
}

function updateMaskFromCidr() {
  const val = parseInt($cidr.val().substr(1), 10);

  let maskBin = '';
  maskBin = maskBin.padEnd(val, '1');
  maskBin = maskBin.padEnd(32, '0');

  const octs = [
    maskBin.substr(0, 8),
    maskBin.substr(8, 8),
    maskBin.substr(16, 8),
    maskBin.substr(24, 8)
  ];

  for (let i = 0; i < 4; i++) {
    octs[i] = bin8ToInt(octs[i]);
  }

  $mask.val(octs.join('.'));
}

function cleanCidr(e) {
  const regex = /[^\d\/]/g;
  let newCidr = e.target.value.replace(regex, '');

  $(e.target).val(newCidr);

  cidrValid = true;
  if (newCidr[0] !== '/') {
    cidrValid = false;
    return;
  }

  var val = newCidr.substr(1);
  val = parseInt(val, 10);
  if (isNaN(val) || val > 32 || val < 1) {
    cidrValid = false;
  }
}

function cleanAddr(e) {
  const regex = /[^\d.]/g;
  let newAddr = e.target.value.replace(regex, '');

  const octs = newAddr.split('.');

  eval(e.target.id + 'Valid = true;');
  if (octs.length === 4) {
    for (let i = 0; i < 4; i++) {
      let octInt = parseInt(octs[i], 10);
      if (octInt < 0) { octInt = 0; }
      if (octInt > 255) { octInt = 255; }

      if (isNaN(octInt)) {
        octs[i] = '';
        eval(e.target.id + 'Valid = false;');
      } else {
        octs[i] = octInt;
      }
    }
  } else {
    eval(e.target.id + 'Valid = false;');
  }

  $(e.target).val(octs.join('.'));
}

function validateMask() {
  maskValid = true;
  let octs = $mask.val().split('.');

  for (let i = 0; i < octs.length; i++) {
    octs[i] = int8ToBin(octs[i]);
  }

  const str = octs.join('');

  let foundZero = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '0') {
      foundZero = true;
    }

    if(foundZero && str[i] === '1') {
      maskValid = false;
      return;
    }
  }
}

function validateWild() {
  wildValid = true;
  let octs = $wild.val().split('.');

  for (let i = 0; i < octs.length; i++) {
    octs[i] = int8ToBin(octs[i]);
  }

  const str = octs.join('');

  let foundOne = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '1') {
      foundOne = true;
    }

    if(foundOne && str[i] === '0') {
      wildValid = false;
      return;
    }
  }
}

function updateBinVals() {
  const names = ['addr', 'mask', 'wild'];
  let octs = [];

  for (let i = 0; i < names.length; i++) {
    eval('octs = $' + names[i] + '.val().split(".");');

    for (let i = 0; i < octs.length; i++) {
      octs[i] = int8ToBin(octs[i]);
    }

    eval('$' + names[i] + 'Bin.html(octs.join("."));');
  }
}

function updateCIDR() {
  let octs = $mask.val().split('.');

  for (let i = 0; i < octs.length; i++) {
    octs[i] = int8ToBin(octs[i]);
  }

  const str = octs.join('');

  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '0') {
      break;
    }

    count++;
  }

  $cidr.val('/' + count);
}

function showHideErrors() {
  addrValid ? $addrError.hide() : $addrError.show();
  maskValid ? $maskError.hide() : $maskError.show();
  cidrValid ? $cidrError.hide() : $cidrError.show();
  wildValid ? $wildError.hide() : $wildError.show();
}

function int8ToBin(int8) {
  return (int8 >>> 0).toString(2).padStart(8, '0');
}

function bin8ToInt(bin8) {
  return parseInt(bin8, 2);
}
