## Poon Markdown

Small React markdown renderer.

```javascript
import { Markdown } from 'meteor/poon-markdown';
import { Touchable } from 'meteor/poon';

<Markdown content={content} link={Touchable}/>
```

Tables use standard pipe syntax:

```markdown
| Name | Count |
| :--- | ---: |
| Apples | 12 |
| Pears | 3 |
```
