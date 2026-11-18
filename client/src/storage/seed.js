const basic = [
    ['arise from', 'xuất phát từ', 'Society', 'Many social problems arise from a lack of opportunity.'],
    ['cover basic living expenses', 'trang trải các chi phí sinh hoạt cơ bản', 'Society', 'Some families struggle to cover basic living expenses.'],
    ['parental supervision', 'sự giám sát của cha mẹ', 'Society', 'Children benefit from consistent parental supervision.'],
    ['contemporary issue', 'vấn đề đương đại', 'Society', 'Housing affordability is a contemporary issue.'],
    ['family gatherings', 'những buổi tụ họp gia đình', 'Society', 'Family gatherings help strengthen relationships.'],
    ['lead to', 'dẫn đến', 'Environment', 'Air pollution can lead to serious health problems.'],
    ['pose a threat to', 'đe dọa', 'Environment', 'Deforestation can pose a threat to wildlife.'],
    ['raise awareness of', 'nâng cao nhận thức về', 'Environment', 'Schools can raise awareness of climate change.'],
    ['play a vital role in', 'đóng vai trò thiết yếu trong', 'Education', 'Teachers play a vital role in supporting young people.'],
    ['depend heavily on', 'phụ thuộc nhiều vào', 'Education', 'Students should not depend heavily on technology.'],
    ['develop essential skills', 'phát triển các kỹ năng thiết yếu', 'Education', 'Volunteering helps students develop essential skills.'],
    ['a double-edged sword', 'con dao hai lưỡi', 'Technology', 'Social media can be a double-edged sword.']
].map(([text, meaningVi, topic, example], index) => ({ id: 'sample-' + index, text, meaningVi, meaningEn: '', topic, example, kind: index === 11 ? 'idiom' : 'collocation', forms: [], status: 'basic', createdAt: 0, importId: 'sample' }));
const contexts = {
    'arise from': { meaningEn: 'to happen as a result of something', forms: ['arises from', 'arose from', 'arising from'], distractors: ['arise with', 'raise from', 'arrive of'], prompts: ['Explain why traffic problems happen.', 'Discuss causes behind urban congestion.'], function: 'cause' },
    'lead to': { meaningEn: 'to cause a result', forms: ['leads to', 'led to', 'leading to'], distractors: ['lead for', 'leave to', 'lead by'], prompts: ['Explain how pollution affects human health.', 'Discuss consequences caused by insufficient sleep.'], function: 'effect' },
    'play a vital role in': { meaningEn: 'to be very important for something', forms: ['plays a vital role in', 'played a vital role in', 'playing a vital role in'], distractors: ['play a vital part on', 'make a vital role in', 'play a vital role at'], prompts: ['Explain why teachers matter.', 'Discuss how education shapes futures.'], function: 'evaluation' },
    'a double-edged sword': { meaningEn: 'something that has both advantages and disadvantages; use with care as it can be overused', forms: ['a double edged sword'], distractors: ['the last straw', 'a blessing in disguise', 'a piece of cake'], prompts: ['Explain why social media brings benefits alongside risks.', 'Discuss digital tools with helpful yet harmful consequences.'], scenarios: ['An online platform helps friends communicate but also spreads harmful rumours.', 'New software saves time but creates privacy risks.'], function: 'evaluation' }
};
export const seed = basic.map(item => contexts[item.text] ? { ...item, ...contexts[item.text], status: 'ready' } : item);
