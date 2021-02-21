
let $addr;
let $mask;
let $cidr;
let $cidrAdd;
let $cidrSub;
let $addrBin;
let $maskBin;
let $subnetBin;
let $subnets;
let $subnetBits;
let $hostBits;
let $subnetBitsAdd;
let $subnetBitsSub;
let $hostBitsAdd;
let $hostBitsSub;
let $totalSubnets;
let $totalHosts;
let $pagePrev;
let $pageNext;
let $addrError;
let $maskError;

let addrValid = true;
let maskValid = true;
let currPage = 0;
let totalPages = 0;
let timeoutId = null;

const SUBNETS_PER_PAGE = 16;

$(function() {
  $addr = $('#addr');
  $mask = $('#mask');
  $cidr = $('#cidr');
  $cidrAdd = $('#cidrAdd');
  $cidrSub = $('#cidrSub');
  $addrBin = $('#addrBin');
  $maskBin = $('#maskBin');
  $subnetBin = $('#subnetBin');
  $subnets = $('#subnets');
  $subnetBits = $('#subnetBits');
  $hostBits = $('#hostBits');
  $hostBitsAdd = $('#hostBitsAdd');
  $hostBitsSub = $('#hostBitsSub');
  $subnetBitsAdd = $('#subnetBitsAdd');
  $subnetBitsSub = $('#subnetBitsSub');
  $totalSubnets = $('#totalSubnets');
  $totalHosts = $('#totalHosts');
  $pagePrev = $('#pagePrev');
  $pageNext = $('#pageNext');
  $addrError = $('#addrError');
  $maskError = $('#maskError');

  $addr.keyup(function(e) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handleAddrKeyUp(e), 500);
  });

  $mask.keyup(function(e) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handleMaskKeyUp(e), 500);
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

  $pagePrev.mouseup(function(e) {
    currPage -= 1;
    if (currPage < 0) { currPage = 0; }
    updateSubnets();
  });

  $pageNext.mouseup(function(e) {
    currPage += 1;
    if (currPage > totalPages - 1) { currPage = totalPages - 1; }
    updateSubnets();
  });

  updateBinVals();
  updateSubnets();
});

function handleAddrKeyUp(e) {
  cleanAddr(e);
  if (addrValid) { updateBinVals(); updateSubnets(); }
  showHideErrors();
}

function handleMaskKeyUp(e) {
  cleanAddr(e);
  if (maskValid) { validateMask(); }
  if (maskValid) { updateCIDR(); updateBinVals(); updateSubnets(); }
  showHideErrors();
}

function updateCidrVal(val) {
  let cidrVal = parseInt($cidr.val(), 10);
  cidrVal = cidrVal + val;

  if(cidrVal > 32) { cidrVal = 32; }
  if(cidrVal < 0) { cidrVal = 0; }
  $cidr.val(cidrVal);

  updateMaskFromCidr();
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

  currPage = 0;

  updateSubnets();
  updateBinVals();
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

  currPage = 0;

  updateSubnets();
  updateBinVals();
}

function updateSubnets() {
  let html = '';

  const subnetBitsVal = parseInt($subnetBits.val(), 10);
  if (subnetBitsVal < 2) {
    html += '<tr>';
    html += '<td colspan="7" class="text-center">Not enough subnet bits</td>';
    html += '</tr>';

    $subnets.html(html);
    return;
  }

  const hostBitsVal = parseInt($hostBits.val(), 10);
  if (hostBitsVal < 2) {
    html += '<tr>';
    html += '<td colspan="7" class="text-center">Not enough host bits</td>';
    html += '</tr>';

    $subnets.html(html);
    return;
  }

  let totalSubnets = Math.pow(2, subnetBitsVal);

  $totalSubnets.html(totalSubnets.toLocaleString());
  $totalHosts.html(((Math.pow(2, hostBitsVal)) - 2).toLocaleString());

  const addrBits = ipToBits($addr.val());
  const cidrVal = parseInt($cidr.val(), 10);
  const cidrBits = addrBits.substr(0, cidrVal);

  let perPage = totalSubnets > SUBNETS_PER_PAGE ? SUBNETS_PER_PAGE : totalSubnets;

  totalPages = totalSubnets / SUBNETS_PER_PAGE;
  if (totalPages < 1) { totalPages = 1; }

  const first = currPage * perPage;
  const last = first + perPage;

  const subnetMask = ''.padEnd(cidrVal + subnetBitsVal, '1') + ''.padEnd(32 - cidrVal - subnetBitsVal, '0');
  const wildMask = ''.padEnd(cidrVal + subnetBitsVal, '0') + ''.padEnd(32 - cidrVal - subnetBitsVal, '1');

  for (let i = first; i < last; i++) {

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

    html += '<tr class="text-center">';
    html += '<th scope="row">' + (i + 1) + '</th>';
    html += '<td>' + bitsToIp(networkBits) + '</td>';
    html += '<td>' + bitsToIp(firstIpBits) + '</td>';
    html += '<td>' + bitsToIp(lastIpBits) + '</td>';
    html += '<td>' + bitsToIp(broadcastBits) + '</td>';
    html += '<td>' + bitsToIp(subnetMask) + '</td>';
    html += '<td>' + bitsToIp(wildMask) + '</td>';
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

function updateBinVals() {
  const names = ['addr', 'mask', 'subnet'];
  let octs = [];
  const cidrVal = parseInt($cidr.val(), 10);
  const subnetVal = parseInt($subnetBits.val(), 10);

  for (let n = 0; n < names.length; n++) {
    eval('octs = $' + (names[n] === 'subnet' ? 'mask' : names[n]) + '.val().split(".");');

    for (let i = 0; i < 4; i++) {
      octs[i] = int8ToBin(octs[i]);
    }

    let tmp = octs.join('');
    let pre = '';

    if (names[n] === 'subnet') {
      pre = tmp.substr(0, cidrVal) + ''.padEnd(subnetVal, '1') + tmp.substr(cidrVal + subnetVal, 32 - cidrVal - subnetVal);
    } else {
      pre = tmp;
    }

    octs = [
      pre.substr(0, 8),
      pre.substr(8, 8),
      pre.substr(16, 8),
      pre.substr(24, 8),
    ];

    let charCount = 0;
    for (let i = 0; i < 4; i++) {
      let newOct = '';

      if (i === 0) {
        newOct += '<span class="text-danger">';
      }

      for (let j = 0; j < octs[i].length; j++) {
        if (cidrVal === charCount && (names[n] === 'addr' || names[n] === 'mask')) {
          newOct += '</span><span class="text-primary">';
        } else if(cidrVal === charCount && names[n] === 'subnet') {
          newOct += '</span><span class="text-info">';
        } else if(cidrVal + subnetVal === charCount && names[n] === 'subnet') {
          newOct += '</span><span class="text-primary">';
        }

        newOct += octs[i][j];
        charCount++;
      }

      if (i === 31) {
        newOct += '</span>';
      }

      octs[i] = newOct;
    }

    eval('$' + names[n] + 'Bin.html(octs.join("<span class=\\"text-dark\\">.</span>"));');
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
}

function int8ToBin(int8, padding=true) {
  let val = (int8 >>> 0).toString(2);
  if (padding) { val = val.padStart(8, '0'); }
  return val;
}

function bin8ToInt(bin8) {
  return parseInt(bin8, 2);
}
