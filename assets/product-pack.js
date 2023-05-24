document.querySelectorAll('.pack-wrapper .pack').forEach(pack => {
  pack.addEventListener('click', function () {
    resetSelectedPack()
    pack.classList.add('pack-selected')
    document.querySelector('input[name=quantity].quantity__input').value = pack.dataset.quantity
  })
})

function resetSelectedPack() {
  document.querySelectorAll('.pack-wrapper .pack').forEach(pack => {
    pack.classList.remove('pack-selected');
  })
}