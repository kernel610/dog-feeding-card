# Dog Feeding Card

A Home Assistant dashboard card that shows a photo of your dog with Breakfast and Dinner status circles underneath. When a meal's sensor is `on`, the circle shows a check. When it's `off`, it shows an X. Everything is configurable from the card editor, and the card picks up your dashboard theme for fonts, background, and corner radius.

## Install with HACS

1. In HACS, open the three-dot menu and choose **Custom repositories**.
2. Paste this repository's URL and set the category to **Dashboard**.
3. Find **Dog Feeding Card** in HACS and click **Download**.
4. Hard refresh your browser.

HACS adds the resource for you. If the card doesn't show up in the picker, check Settings > Dashboards > Resources for `/hacsfiles/dog-feeding-card/dog-feeding-card.js` and add it as a JavaScript module if it's missing.

## Manual install

Copy `dog-feeding-card.js` to `/config/www/`, then add `/local/dog-feeding-card.js` as a JavaScript module under Settings > Dashboards > Resources.

## Add the card

Add a card, pick **Dog Feeding**, and fill in the editor. Or use YAML:

```yaml
type: custom:dog-feeding-card
name: Buddy
image: /local/dog.jpg
image_position: center 25%
breakfast_entity: binary_sensor.dog_breakfast_fed
dinner_entity: binary_sensor.dog_dinner_fed
on_circle_color: var(--success-color)
on_icon_color: white
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `name` | none | Pet's name, shown as a header above the photo. Leave empty to hide the header. |
| `image` | none | Path or URL to the dog photo, for example `/local/dog.jpg`. Cropped to a rounded square. |
| `image_size` | `120` | Photo size in pixels. |
| `image_position` | `center` | Where the crop is anchored, as a CSS `object-position` value like `center 20%`. |
| `breakfast_entity` | none | Binary sensor or input boolean for breakfast. |
| `dinner_entity` | none | Binary sensor or input boolean for dinner. |
| `on_circle_color` | `#dff0d3` | Circle color when the sensor is `on`. |
| `on_icon_color` | `#5fa83f` | Check color when the sensor is `on`. |
| `off_circle_color` | `#bfbfbf` | Circle color when the sensor is `off`. |
| `off_icon_color` | `#808080` | X color when the sensor is `off`. |

Color options accept a hex value, `rgb()`, a CSS variable such as `var(--primary-color)`, or a bare theme name such as `green`.

Tapping a circle opens that sensor's more-info dialog. If a sensor is unavailable, its circle is dimmed.

## Tracking meals with a vibration sensor

One way to drive the two sensors is a pair of History Stats helpers that count vibration triggers inside each meal window, with a Template binary sensor on top of each:

```
{{ states('sensor.dog_breakfast_count') | int(0) >= 1 }}
```

Use `today_at("05:00")` to `today_at("11:00")` for breakfast and `today_at("17:00")` to `today_at("23:00")` for dinner. The counts reset on their own each day.
