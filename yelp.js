const Yelp = require('yelp');

const opts = {
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
};

const yelp = new Yelp(opts);

const makeYelpOpts = (params) => {
  let options = {};
  if (params.location) {
    options = {
      category_filter: params.category,
      limit: 10,
      location: params.location,
    };
  } else if (params.latitude && params.longitude) {
    options = {
      category_filter: params.category,
      ll: `${params.latitude},${params.longitude}`,
      limit: 10,
    };
  }
  return options;
};

const makeYelpStars = (rating) => {
  let result = '';
  let counter = Math.floor(rating);
  while (counter > 0) {
    result += '*';
    counter--;
  }
  if (Math.floor(rating) !== rating) {
    result += '1/2';
  }
  return result;
};

const search = (params) => {
  const options = makeYelpOpts(params);
  return yelp.search(options)
    .then(res => {
      console.log('res:', res);
      return res.businesses;
    })
    .then(businesses => businesses.map((business) => {
      const parsed = {
        address: business.location.display_address.join(', '),
        coords: business.location.coordinate,
        id: business.id,
        image: business.image_url,
        name: business.name,
        rating: makeYelpStars(business.rating),
        url: business.mobile_url,
      };
      return parsed;
    }));
};

/*
{ is_claimed: true,
    rating: 4.5,
    mobile_url: 'http://m.yelp.com/biz/coconuts-fish-cafe-sacramento?utm_campaign=yelp_api&utm_medium=api_v2_search&utm_source=TsnPAO-_aWxaIOg9pINODA',
    rating_img_url: 'https://s3-media2.fl.yelpcdn.com/assets/2/www/img/99493c12711e/ico/stars/v1/stars_4_half.png',
    review_count: 97,
    name: 'Coconut\'s Fish Cafe',
    rating_img_url_small: 'https://s3-media2.fl.yelpcdn.com/assets/2/www/img/a5221e66bc70/ico/stars/v1/stars_small_4_half.png',
    url: 'http://www.yelp.com/biz/coconuts-fish-cafe-sacramento?utm_campaign=yelp_api&utm_medium=api_v2_search&utm_source=TsnPAO-_aWxaIOg9pINODA',
    categories: [ [Object], [Object] ],
    phone: '9164400449',
    snippet_text: 'Yes, finally a Hawaiian restaurant! ...',
    image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/bmM0Ze_2L8HJAM_opK0brw/ms.jpg',
    snippet_image_url: 'http://s3-media2.fl.yelpcdn.com/photo/2LzOFouvQgn77pDalc9c-A/ms.jpg',
    display_phone: '+1-916-440-0449',
    rating_img_url_large: 'https://s3-media4.fl.yelpcdn.com/assets/2/www/img/9f83790ff7f6/ico/stars/v1/stars_large_4_half.png',
    id: 'coconuts-fish-cafe-sacramento',
    is_closed: false,
    location:
     { city: 'Sacramento',
       display_address: [Object],
       geo_accuracy: 8,
       neighborhoods: [Object],
       postal_code: '95814',
       country_code: 'US',
       address: [Object],
       coordinate: [Object],
       state_code: 'CA' } }
*/

module.exports = {
  search,
};
