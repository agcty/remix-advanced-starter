import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { db } from "db.server"
import { Switch, SwitchField, SwitchGroup } from "~/components/ui/Switch"
import { Breadcrumbs } from "~/components/ui2/Breadcrumbs"
import { Button } from "~/components/ui2/Button"
import { ComboBox, ComboBoxItem } from "~/components/ui2/ComboBox"
import { ListBox, ListBoxItem } from "~/components/ui2/ListBox"
import { Meter } from "~/components/ui2/Meter"
import { Modal } from "~/components/ui2/Modal"
import { NumberField } from "~/components/ui2/NumberField"
import { Radio, RadioGroup } from "~/components/ui2/RadioGroup"
import { RangeCalendar } from "~/components/ui2/RangeCalendar"
import { SearchField } from "~/components/ui2/SearchField"
import { Slider } from "~/components/ui2/Slider"
import { TimeField } from "~/components/ui2/TimeField"
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const orgs = await db.query.organizations.findMany()
  const users = await db.query.users.findMany()
  const sessions = await db.query.sessions.findMany()
  const connections = await db.query.connections.findMany()

  // return true
  return json(
    {
      orgs,
      users,
      sessions,
      connections,
    },
    // {
    //   headers: await createToastHeaders({
    //     description: "This is a test page.",
    //   }),
    // },
  )
  // return redirectWithToast("/", {
  //   title: "Test",
  //   description: "This is a test page.",
  // })
}

export default function Test() {
  return (
    <div className="">
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

      <Button>Test</Button>
      <p className="text-red-500">Test</p>
      <Modal />

      <NumberField /> */}
      <Slider />
      <div>
        <Meter label="Storage Label" value={99} className="max-w-7xl" />
      </div>

      <TimeField />
    </div>
  )
}
