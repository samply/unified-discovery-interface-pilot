# Unified Discovery Interface pilot

This fork of the Lens2 project provides functionality that allows search both in
the Directory and in the BBMRI Locator.

It also gives the user the possibility to enter search terms in free text, rather
than needing to come to terms with the complexity of the GUI. The typed text
is passed to a locally-running AI (Mistral) which turns it into suitably formatted
JSON, which is then used to select the appropriate search terms.

## Implementation Guide 

#### Catalogue
<!-- TODO -->

#### CQL Parsing 
<!-- TODO -->

#### Integrate Data Structure 
<!-- TODO -->

---

## Quickstart Instructions 

To start a development server, run the command:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open


```
To create a production version of your application:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

---

*Made with ♥ using [samply/lens-core](https://github.com/samply/lens)*
