-- Get all offers that may profit
SELECT 
  `item`, 
  MIN(`buyPrice`) as `bp`, 
  MAX(`sellPrice`) as `sp`, 
  (MAX(`sellPrice`) - MIN(`buyPrice`)) as `diff`,
  (SELECT `shop` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` ORDER BY `io`.`buyPrice` ASC LIMIT 1) as `buyShop`,
  (SELECT `shop` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` ORDER BY `io`.`sellPrice` DESC LIMIT 1) as `sellShop`,
  (SELECT `empty` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` ORDER BY `io`.`buyPrice` ASC LIMIT 1) as `buyEmpty`,
  (SELECT `full` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` ORDER BY `io`.`sellPrice` DESC LIMIT 1) as `sellFull`
FROM `offer` as `o` 
GROUP BY `item` 
HAVING `bp` < `sp`
ORDER BY `diff` DESC;

-- Only get offers that should work
SELECT 
  `item`, 
  (SELECT MIN(`buyPrice`) FROM `offer` as `bo` WHERE `bo`.`item` = `o`.`item` AND `bo`.`empty` = 0) as `bp`, 
  (SELECT MAX(`sellPrice`) FROM `offer` as `bo` WHERE `bo`.`item` = `o`.`item` AND `bo`.`full` = 0) as `sp`, 
  ((SELECT MAX(`sellPrice`) FROM `offer` as `bo` WHERE `bo`.`item` = `o`.`item` AND `bo`.`full` = 0) - (SELECT MIN(`buyPrice`) FROM `offer` as `bo` WHERE `bo`.`item` = `o`.`item` AND `bo`.`empty` = 0)) as `diff`,
  (SELECT `shop` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` AND `io`.`empty` = 0 ORDER BY `io`.`buyPrice` ASC LIMIT 1) as `buyShop`,
  (SELECT `shop` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` AND `io`.`full` = 0 ORDER BY `io`.`sellPrice` DESC LIMIT 1) as `sellShop`,
  (SELECT `empty` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` AND `io`.`empty` = 0 ORDER BY `io`.`buyPrice` ASC LIMIT 1) as `buyEmpty`,
  (SELECT `full` FROM `offer` as `io` WHERE `io`.`item` = `o`.`item` AND `io`.`full` = 0 ORDER BY `io`.`sellPrice` DESC LIMIT 1) as `sellFull`
FROM `offer` as `o` 
GROUP BY `item` 
HAVING `bp` < `sp` AND `buyEmpty` = 0 AND `sellFull` = 0
ORDER BY `diff` DESC;
