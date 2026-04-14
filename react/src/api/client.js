import axios from 'axios';

const client = axios.create({
  baseURL: 'https://portfolio-website-m7x3.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
