export function currencyNumberFormatter(input: number | string) {
  input = input.toString();
  input = input.replace(/\,/g, '');
  let x = input.split('.');
  let x1 = x[0];
  let x2 = x.length > 1 ? '.' + x[1] : '';
  let rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

export function currencyInputFormatter(input: HTMLInputElement) {
  const formattedValue = currencyNumberFormatter(input.value);
  input.value = formattedValue;
}
