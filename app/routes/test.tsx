import { type LoaderFunctionArgs } from "@remix-run/node"
import { db } from "db.server"
import { Switch, SwitchField, SwitchGroup } from "~/components/ui/Switch"
import { Breadcrumbs } from "~/components/ui2/Breadcrumbs"
import { Button } from "~/components/ui2/Button"
import { ComboBox, ComboBoxItem } from "~/components/ui2/ComboBox"
import { ListBox, ListBoxItem } from "~/components/ui2/ListBox"
import { Radio, RadioGroup } from "~/components/ui2/RadioGroup"
import { RangeCalendar } from "~/components/ui2/RangeCalendar"
import { SearchField } from "~/components/ui2/SearchField"

export async function loader({ request }: LoaderFunctionArgs) {
  const orgs = await db.query.organizations.findMany()
  const users = await db.query.users.findMany()
  const sessions = await db.query.sessions.findMany()
  const connections = await db.query.connections.findMany()

  return true
  // return redirectWithToast("/", {
  //   title: "Test",
  //   description: "This is a test page.",
  // })
}

export default function Test() {
  return (
    <div className="mx-auto max-w-xl">
      {/* <SwitchGroup>
        <SwitchField>Test</SwitchField>
        <Switch color="amber" />
      </SwitchGroup>

      <RadioGroup>
        <Radio value="Test" color="red">
          Test
        </Radio>
        <Radio value="Test">Test</Radio>
      </RadioGroup>

      <RangeCalendar />

      <SearchField />

      <Breadcrumbs />

      <ComboBox>
        <ComboBoxItem>Test</ComboBoxItem>
      </ComboBox>

      <ListBox onAction={() => alert("test")}>
        <ListBoxItem>Test</ListBoxItem>
        <ListBoxItem>Test</ListBoxItem>
        <ListBoxItem>Test</ListBoxItem>
        <ListBoxItem>Test</ListBoxItem>
        <ListBoxItem>Test</ListBoxItem>
        <ListBoxItem>Test</ListBoxItem>
      </ListBox>

      <Button>Test</Button> */}
      <p className="text-red-500">Test</p>
    </div>
  )
}
