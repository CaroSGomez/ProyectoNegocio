// ÁNIMA — filtrado simple de catálogo por forma / tamaño / uso / aroma
// Las categorías están codificadas en product-tag de cada card para esta demo.

document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.product-card'));
  const checkboxes = Array.from(document.querySelectorAll('.filter-option input'));
  const resultCount = document.getElementById('result-count');
  const resetBtn = document.querySelector('.filter-reset');

  function getCheckedLabels(groupHeading) {
    const group = Array.from(document.querySelectorAll('.filter-group')).find(
      g => g.querySelector('.filter-heading').textContent.trim() === groupHeading
    );
    if (!group) return [];
    return Array.from(group.querySelectorAll('input:checked')).map(
      input => input.nextElementSibling.textContent.trim().toLowerCase()
    );
  }

  function applyFilters() {
    const shapes = getCheckedLabels('Forma');
    const sizes = getCheckedLabels('Tamaño');

    let visibleCount = 0;

    cards.forEach(card => {
      const tagText = card.querySelector('.product-tag').textContent.toLowerCase();

      const matchesShape = shapes.some(shape => tagText.includes(shape.split(' ')[0]));
      const matchesSize = sizes.some(size => tagText.includes(size.split(' ')[0]));

      const visible = matchesShape && matchesSize;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    resultCount.textContent = visibleCount;
  }

  checkboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      checkboxes.forEach(cb => (cb.checked = true));
      applyFilters();
    });
  }

  applyFilters();
});