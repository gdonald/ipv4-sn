
let $addr;
let $mask;
let $wild;
let $cidr;
let $cidrAdd;
let $cidrSub;
let $addrBin;
let $maskBin;
let $wildBin;
let $subnets;
let $subnetBits;
let $hostBits;
let $subnetBitsAdd;
let $subnetBitsSub;
let $hostBitsAdd;
let $hostBitsSub;
let $totalSubnets;
let $totalHosts;

let $addrError;
let $maskError;
let $wildError;

let addrValid = true;
let maskValid = true;
let wildValid = true;

$(function() {
  $addr = $('#addr');
  $mask = $('#mask');
  $wild = $('#wild');
  $cidr = $('#cidr');
  $cidrAdd = $('#cidrAdd');
  $cidrSub = $('#cidrSub');
  $addrBin = $('#addrBin');
  $maskBin = $('#maskBin');
  $wildBin = $('#wildBin');
  $subnets = $('#subnets');
  $subnetBits = $('#subnetBits');
  $hostBits = $('#hostBits');
  $hostBitsAdd = $('#hostBitsAdd');
  $hostBitsSub = $('#hostBitsSub');
  $subnetBitsAdd = $('#subnetBitsAdd');
  $subnetBitsSub = $('#subnetBitsSub');
  $totalSubnets = $('#totalSubnets');
  $totalHosts = $('#totalHosts');

  $addrError = $('#addrError');
  $maskError = $('#maskError');
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

  $wild.keyup(function(e) {
    cleanAddr(e);
    if (wildValid) { validateWild(); }
    if (wildValid) { updateMaskFromWild(); updateCIDR(); updateBinVals(); }
    showHideErrors();
  });

  $cidrAdd.mouseup(function(e) {
    updateCidrVal(1);
  });

  $cidrSub.mouseup(function(e) {
    updateCidrVal(-1);
  });

  $subnetBitsAdd.mouseup(function(e) {
    updateSubnetBitsVal(1);
  });

  $subnetBitsSub.mouseup(function(e) {
    updateSubnetBitsVal(-1);
  });

  $hostBitsAdd.mouseup(function(e) {
    updateHostBitsVal(1);
  });

  $hostBitsSub.mouseup(function(e) {
    updateHostBitsVal(-1);
  });

  updateBinVals();
  updateSubnets();
});

function updateCidrVal(val) {
  let cidrVal = parseInt($cidr.val(), 10);
  cidrVal = cidrVal + val;

  if(cidrVal > 32) { cidrVal = 32; }
  if(cidrVal < 0) { cidrVal = 0; }

  $cidr.val(cidrVal);

  updateMaskFromCidr();
  updateWildFromMask();
  updateBinVals();

  updateSubnetBitsVal(0);
}

function updateSubnetBitsVal(val) {
  let subnetBitsVal = parseInt($subnetBits.val(), 10);
  subnetBitsVal = subnetBitsVal + val;

  let cidrVal = parseInt($cidr.val(), 10);

  const max = 32 - cidrVal;

  if(subnetBitsVal > max) { subnetBitsVal = max; }
  if(subnetBitsVal < 0) { subnetBitsVal = 0; }

  $subnetBits.val(subnetBitsVal);
  $hostBits.val(max - subnetBitsVal);

  updateSubnets();
}

function updateHostBitsVal(val) {
  let hostBitsVal = parseInt($hostBits.val(), 10);
  hostBitsVal = hostBitsVal + val;

  let cidrVal = parseInt($cidr.val(), 10);

  const max = 32 - cidrVal;

  if(hostBitsVal > max) { hostBitsVal = max; }
  if(hostBitsVal < 0) { hostBitsVal = 0; }

  $hostBits.val(hostBitsVal);
  $subnetBits.val(max - hostBitsVal);

  updateSubnets();
}

function updateSubnets() {
  const subnetBitsVal = parseInt($subnetBits.val(), 10);
  const hostBitsVal = parseInt($hostBits.val(), 10);
  const totalSubnets = Math.pow(2, subnetBitsVal);

  $totalSubnets.html(totalSubnets.toLocaleString());
  $totalHosts.html(((Math.pow(2, hostBitsVal)) - 2).toLocaleString());

  const addrBits = ipToBits($addr.val());
  const cidrVal = parseInt($cidr.val(), 10);
  const cidrBits = addrBits.substr(0, cidrVal);

  let html = '';
  for (let i = 0; i < totalSubnets; i++) {

    let networkBits = cidrBits;
    networkBits += int8ToBin(i, false).padStart(cidrVal + subnetBitsVal - networkBits.length, '0');
    networkBits += ''.padStart(subnetBitsVal, '0');
    networkBits += ''.padEnd(32 - networkBits.length, '0');

    let firstIpBits = cidrBits;
    firstIpBits += int8ToBin(i, false).padStart(cidrVal + subnetBitsVal - firstIpBits.length, '0');
    firstIpBits += ''.padEnd(31 - firstIpBits.length, '0');
    firstIpBits += '1';

    let lastIpBits = cidrBits;
    lastIpBits += int8ToBin(i, false).padStart(cidrVal + subnetBitsVal - lastIpBits.length, '0');
    lastIpBits += ''.padEnd(31 - lastIpBits.length, '1');
    lastIpBits += '0';

    let broadcastBits = cidrBits;
    broadcastBits += int8ToBin(i, false).padStart(cidrVal + subnetBitsVal - broadcastBits.length, '0');
    broadcastBits += ''.padEnd(32 - broadcastBits.length, '1');

    html += '<tr>';
    html += '<th scope="row">' + (i + 1) + '</th>';
    html += '<td>' + bitsToIp(networkBits) + '</td>';
    html += '<td>' + bitsToIp(firstIpBits) + '</td>';
    html += '<td>' + bitsToIp(lastIpBits) + '</td>';
    html += '<td>' + bitsToIp(broadcastBits) + '</td>';
    html += '</tr>';
  }

  $subnets.html(html);
}

function bitsToIp(bits) {
  const octs = [
    bits.substr(0, 8),
    bits.substr(8, 8),
    bits.substr(16, 8),
    bits.substr(24, 8)
  ];

  for (let i = 0; i < 4; i++) {
    octs[i] = bin8ToInt(octs[i]);
  }

  return octs.join('.');
}

function ipToBits(ip) {
  let octs = ip.split('.');

  for (let i = 0; i < 4; i++) {
    octs[i] = int8ToBin(octs[i]);
  }

  return octs.join('');
}

function updateMaskFromWild() {
  let octs = $wild.val().split('.');

  for (let i = 0; i < 4; i++) {
    octs[i] = 255 - octs[i];
  }

  $mask.val(octs.join('.'));
}

function updateWildFromMask() {
  let octs = $mask.val().split('.');

  for (let i = 0; i < 4; i++) {
    octs[i] = 255 - octs[i];
  }

  $wild.val(octs.join('.'));
}

function updateMaskFromCidr() {
  const val = parseInt($cidr.val(), 10);

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

function cleanAddr(e) {
  const regex = /[^\d.]/g;
  let newAddr = e.target.value.replace(regex, '');

  const octs = newAddr.split('.');

  eval(e.target.id + 'Valid = true;');
  if (4 === 4) {
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

  for (let i = 0; i < 4; i++) {
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

  for (let i = 0; i < 4; i++) {
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
  const cidrVal = parseInt($cidr.val(), 10);

  for (let i = 0; i < names.length; i++) {
    eval('octs = $' + names[i] + '.val().split(".");');

    let charCount = 0;
    for (let i = 0; i < 4; i++) {
      octs[i] = int8ToBin(octs[i]);

      let newOct = '';

      if (i === 0) {
        newOct += '<span class="text-danger">';
      }

      for (let j = 0; j < octs[i].length; j++) {
        if (cidrVal === charCount++) {
          newOct += '</span><span class="text-primary">' + octs[i][j];
        } else {
          newOct += octs[i][j];
        }
      }

      if (i === 31) {
        newOct += '</span>';
      }

      octs[i] = newOct;
    }

    eval('$' + names[i] + 'Bin.html(octs.join("<span class=\\"text-dark\\">.</span>"));');
  }
}

function updateCIDR() {
  let octs = $mask.val().split('.');

  for (let i = 0; i < 4; i++) {
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

  $cidr.val(count);
}

function showHideErrors() {
  addrValid ? $addrError.hide() : $addrError.show();
  maskValid ? $maskError.hide() : $maskError.show();
  wildValid ? $wildError.hide() : $wildError.show();
}

function int8ToBin(int8, padding=true) {
  let val = (int8 >>> 0).toString(2);
  if (padding) { val = val.padStart(8, '0'); }
  return val;
}

function bin8ToInt(bin8) {
  return parseInt(bin8, 2);
}
