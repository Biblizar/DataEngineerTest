SELECT customer.customer_id,customer.last_name,customer.first_name,COUNT(*) as totrental,address.address,address.latitude,address.longitude
FROM customer
JOIN rental
ON customer.customer_id = rental.customer_id
JOIN address
ON customer.address_id = address.address_id
GROUP BY rental.customer_id
ORDER BY totrental DESC
LIMIT 1
