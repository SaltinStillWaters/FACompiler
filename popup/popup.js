const STATE_CLASS = 'question_points_holder';

function getSpanByClass(className)
{
    const spanElement = document.querySelector('span.' + className);
    return spanElement ? spanElement : null;
}



document.getElementById('submitButton').addEventListener('click', () => {
  const state = document.documentElement.outerHTML;

  console.log('state: ', state);
  });
  
  